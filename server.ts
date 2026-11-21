import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const MODEL_NAME = 'gemini-4-hydrogen';
const PORT = Number(process.env.PORT) || 3000;

interface TopicInput {
  id?: string;
  title: string;
  content?: string;
}

interface BankGenerateRequest {
  subjectName: string;
  gradeLevel?: string;
  topics: TopicInput[];
  mcqCount: number;
  essayCount: number;
  difficulty?: string;
}

interface GeneratedBankOption {
  id: string;
  text: string;
  is_correct: boolean;
}

interface GeneratedBankQuestion {
  question_kind: 'mcq' | 'essay';
  topic_title: string;
  difficulty: 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';
  question_text: string;
  options: GeneratedBankOption[];
  correct_answer: string;
  explanation: string;
}

class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 500, code = 'AI_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new ApiError(
      'Chưa thiết lập GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra khóa API trong bảng Settings > Secrets.',
      503,
      'MISSING_GEMINI_API_KEY'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapGeminiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const raw = err as { status?: number; code?: string; message?: string };
  const msg = raw?.message || 'Lỗi không xác định khi gọi Gemini AI.';
  const upper = msg.toUpperCase();

  if (
    raw?.status === 403 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID')
  ) {
    return new ApiError(
      'Khóa GEMINI_API_KEY không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại trong Settings > Secrets.',
      403,
      'API_KEY_INVALID'
    );
  }
  if (raw?.status === 429 || upper.includes('RESOURCE_EXHAUSTED')) {
    return new ApiError(
      'Hệ thống Gemini AI đang vượt giới hạn lượt gọi (Quota). Vui lòng thử lại sau ít phút hoặc kiểm tra hạn mức API.',
      429,
      'RESOURCE_EXHAUSTED'
    );
  }
  if (raw?.status === 404 || upper.includes('NOT_FOUND')) {
    return new ApiError(
      `Không tìm thấy mô hình ${MODEL_NAME} hoặc điểm cuối API không khả dụng.`,
      404,
      'MODEL_NOT_FOUND'
    );
  }
  return new ApiError(msg, raw?.status && raw.status >= 400 ? raw.status : 500, 'GEMINI_CALL_FAILED');
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const mapped = mapGeminiError(err);
      if (mapped.code === 'MISSING_GEMINI_API_KEY' || mapped.code === 'API_KEY_INVALID' || mapped.code === 'MODEL_NOT_FOUND') {
        throw mapped;
      }
      if (attempt < maxRetries) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw mapGeminiError(lastErr);
}

function difficultyLabel(difficulty?: string): string {
  switch (difficulty) {
    case 'nhan_biet':
      return 'Nhận biết (cơ bản, ghi nhớ kiến thức trực tiếp)';
    case 'thong_hieu':
      return 'Thông hiểu (hiểu bản chất, giải thích, áp dụng trực tiếp)';
    case 'van_dung':
      return 'Vận dụng (giải bài tập tổng hợp, tình huống thực tế)';
    case 'van_dung_cao':
      return 'Vận dụng cao (phân tích sâu, bài toán nâng cao phân loại)';
    default:
      return 'Phân bổ hài hòa từ Nhận biết, Thông hiểu đến Vận dụng';
  }
}

function normalizeDifficulty(
  raw: string | undefined,
  requested: string | undefined
): 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao' {
  if (
    requested === 'nhan_biet' ||
    requested === 'thong_hieu' ||
    requested === 'van_dung' ||
    requested === 'van_dung_cao'
  ) {
    return requested;
  }
  if (
    raw === 'nhan_biet' ||
    raw === 'thong_hieu' ||
    raw === 'van_dung' ||
    raw === 'van_dung_cao'
  ) {
    return raw;
  }
  return 'thong_hieu';
}

function normalizeBankQuestion(
  item: Partial<GeneratedBankQuestion>,
  expectedKind: 'mcq' | 'essay',
  fallbackTopic: string,
  requestedDifficulty?: string
): GeneratedBankQuestion {
  const kind: 'mcq' | 'essay' = expectedKind;
  const topicTitle = (item.topic_title || '').trim() || fallbackTopic;
  const difficulty = normalizeDifficulty(item.difficulty, requestedDifficulty);
  const questionText = (item.question_text || '').trim();
  const explanation =
    (item.explanation || '').trim() ||
    'Lời giải chi tiết bám sát chuẩn kiến thức môn học.';

  if (kind === 'essay') {
    return {
      question_kind: 'essay',
      topic_title: topicTitle,
      difficulty,
      question_text: questionText,
      options: [],
      correct_answer:
        (item.correct_answer || '').trim() ||
        'Đáp án mẫu và hướng dẫn chấm điểm chi tiết theo từng ý chính.',
      explanation,
    };
  }

  const ids = ['A', 'B', 'C', 'D'];
  const rawOptions = Array.isArray(item.options) ? item.options : [];
  let correctId = typeof item.correct_answer === 'string' ? item.correct_answer.trim().toUpperCase() : '';
  if (!ids.includes(correctId)) {
    const flagged = rawOptions.find((o) => o && o.is_correct && ids.includes(String(o.id).toUpperCase()));
    correctId = flagged ? String(flagged.id).toUpperCase() : 'A';
  }

  const normalizedOptions: GeneratedBankOption[] = ids.map((id, idx) => {
    const matched = rawOptions.find((o) => String(o?.id || '').trim().toUpperCase() === id) || rawOptions[idx];
    const text = (matched?.text || '').trim() || `Phương án ${id}`;
    return {
      id,
      text,
      is_correct: id === correctId,
    };
  });

  return {
    question_kind: 'mcq',
    topic_title: topicTitle,
    difficulty,
    question_text: questionText,
    options: normalizedOptions,
    correct_answer: correctId,
    explanation,
  };
}

async function generateBankBatch(
  ai: GoogleGenAI,
  params: {
    subjectName: string;
    gradeLevel: string;
    topics: TopicInput[];
    mcqCount: number;
    essayCount: number;
    difficulty: string;
  }
): Promise<GeneratedBankQuestion[]> {
  const { subjectName, gradeLevel, topics, mcqCount, essayCount, difficulty } = params;
  const topicsDescription = topics
    .map((t, idx) => {
      const contentSnippet = t.content ? ` — Nội dung trọng tâm: ${t.content.slice(0, 600)}` : '';
      return `${idx + 1}. "${t.title}"${contentSnippet}`;
    })
    .join('\n');

  const prompt = `Bạn là chuyên gia ra đề thi và giáo viên giỏi môn ${subjectName} (${gradeLevel}) theo Chương trình GDPT 2018 của Việt Nam.

Hãy tạo CHÍNH XÁC:
- ${mcqCount} câu hỏi TRẮC NGHIỆM 4 phương án (question_kind = "mcq")
- ${essayCount} câu hỏi TỰ LUẬN (question_kind = "essay")
Tổng cộng đúng ${mcqCount + essayCount} câu hỏi, phân bổ đều qua các chủ đề môn học dưới đây:
${topicsDescription}

Mức độ nhận thức yêu cầu: ${difficultyLabel(difficulty)}.

Quy định chất lượng BẮT BUỘC:
1. Tất cả câu hỏi, phương án và lời giải phải viết bằng tiếng Việt chuẩn mực, chính xác về mặt khoa học (nếu môn Tiếng Anh thì đề bài và phương án câu hỏi bằng tiếng Anh kèm lời giải chi tiết bằng tiếng Việt).
2. Với công thức Toán, Lý, Hóa: viết bằng LaTeX đặt trong cặp dấu $...$ (ví dụ: $x^2 - 4x + 3 = 0$, $\\frac{a}{b}$, $v^2 - v_0^2 = 2as$). Không dùng thẻ HTML.
3. Đối với câu trắc nghiệm (question_kind = "mcq"):
   - Có đúng 4 phương án có id lần lượt là "A", "B", "C", "D".
   - Các phương án nhiễu phải hợp lý, mang tính phân loại, không lộ đáp án.
   - Chỉ có ĐÚNG 1 phương án is_correct = true, trùng khớp hoàn toàn với correct_answer ("A" | "B" | "C" | "D").
   - explanation: giải thích chi tiết từng bước vì sao đáp án đúng và tại sao các phương án khác sai.
4. Đối với câu tự luận (question_kind = "essay"):
   - Đề bài rõ ràng, có tình huống thực tế hoặc yêu cầu lập luận/tính toán cụ thể bám sát chủ đề đã chọn.
   - options: mảng rỗng [].
   - correct_answer: đáp án mẫu và hướng dẫn chấm điểm chi tiết theo từng ý (biểu điểm).
   - explanation: hướng dẫn phương pháp giải và lưu ý lỗi sai thường gặp của học sinh.
5. Trường topic_title phải ghi đúng tên một trong các chủ đề đã cung cấp ở trên.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'Bạn là trợ lý sư phạm chuyên nghiệp tạo câu hỏi kiểm tra đánh giá chất lượng cao. Luôn trả về đúng số lượng và cấu trúc JSON theo schema.',
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question_kind: {
                type: Type.STRING,
                description: 'Must be "mcq" for multiple-choice or "essay" for essay.',
              },
              topic_title: {
                type: Type.STRING,
                description: 'Exact title of the selected lesson topic this question belongs to.',
              },
              difficulty: {
                type: Type.STRING,
                description: 'One of: nhan_biet, thong_hieu, van_dung, van_dung_cao.',
              },
              question_text: {
                type: Type.STRING,
                description: 'Full question prompt text.',
              },
              options: {
                type: Type.ARRAY,
                description: '4 options A, B, C, D for mcq; empty array [] for essay.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    is_correct: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'text', 'is_correct'],
                },
              },
              correct_answer: {
                type: Type.STRING,
                description: 'Single letter A/B/C/D for mcq, or detailed rubric/sample answer for essay.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Detailed step-by-step pedagogical explanation.',
              },
            },
            required: [
              'question_kind',
              'topic_title',
              'difficulty',
              'question_text',
              'options',
              'correct_answer',
              'explanation',
            ],
          },
        },
      },
    })
  );

  const rawText = (response.text ?? '[]').trim();
  const parsed = safeJsonParse<Partial<GeneratedBankQuestion>[]>(rawText, []);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ApiError('Gemini AI không trả về danh sách câu hỏi hợp lệ.', 502, 'EMPTY_AI_RESPONSE');
  }

  const mcqsRaw = parsed.filter((q) => q && q.question_kind === 'mcq');
  const essaysRaw = parsed.filter((q) => q && q.question_kind === 'essay');
  const othersRaw = parsed.filter((q) => q && q.question_kind !== 'mcq' && q.question_kind !== 'essay');

  const results: GeneratedBankQuestion[] = [];
  for (let i = 0; i < mcqCount; i++) {
    const candidate = mcqsRaw[i] || othersRaw.shift();
    if (candidate?.question_text) {
      const fallbackTopic = topics[i % topics.length]?.title || 'Chủ đề bài học';
      results.push(normalizeBankQuestion(candidate, 'mcq', fallbackTopic, difficulty));
    }
  }
  for (let j = 0; j < essayCount; j++) {
    const candidate = essaysRaw[j] || othersRaw.shift();
    if (candidate?.question_text) {
      const fallbackTopic = topics[j % topics.length]?.title || 'Chủ đề bài học';
      results.push(normalizeBankQuestion(candidate, 'essay', fallbackTopic, difficulty));
    }
  }

  return results;
}

function safeJsonParse<T>(rawText: string, fallback: T): T {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  if (!cleaned) return fallback;
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  // 1. Endpoint chính: Sinh câu hỏi trắc nghiệm & tự luận thiếu cho Ngân hàng câu hỏi (AssignmentCreateFromBank)
  app.post('/api/gemini/generate-bank-questions', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as Partial<BankGenerateRequest>;
      const subjectName = (body.subjectName || 'Toán học').trim();
      const gradeLevel = (body.gradeLevel || 'THPT').trim();
      const topics = Array.isArray(body.topics) && body.topics.length > 0
        ? body.topics.filter((t) => t && typeof t.title === 'string' && t.title.trim().length > 0)
        : [{ title: 'Kiến thức trọng tâm bài học' }];
      const mcqCount = Math.max(0, Math.min(30, Number(body.mcqCount) || 0));
      const essayCount = Math.max(0, Math.min(30, Number(body.essayCount) || 0));
      const difficulty = (body.difficulty || 'all').trim();

      if (mcqCount + essayCount <= 0) {
        res.status(400).json({
          error: 'Số lượng câu hỏi cần tạo phải lớn hơn 0.',
          code: 'INVALID_COUNT',
        });
        return;
      }

      const ai = getGeminiClient();

      // Chia batch tối đa 8 câu mỗi lần gọi để đảm bảo JSON sắc nét, không bị cắt ngắn khi tạo 20-30 câu
      const MAX_PER_BATCH = 8;
      const tasks: Array<{ mcq: number; essay: number; topicSlice: TopicInput[] }> = [];
      let remMcq = mcqCount;
      let remEssay = essayCount;
      let batchIdx = 0;

      while (remMcq > 0 || remEssay > 0) {
        const takeMcq = Math.min(remMcq, MAX_PER_BATCH);
        const spaceLeft = MAX_PER_BATCH - takeMcq;
        const takeEssay = Math.min(remEssay, spaceLeft > 0 ? spaceLeft : 0);
        remMcq -= takeMcq;
        remEssay -= takeEssay;

        const rotatedTopics = [
          ...topics.slice(batchIdx % topics.length),
          ...topics.slice(0, batchIdx % topics.length),
        ];
        tasks.push({ mcq: takeMcq, essay: takeEssay, topicSlice: rotatedTopics });
        batchIdx++;
      }

      const batchResults: GeneratedBankQuestion[] = [];
      for (const task of tasks) {
        const generated = await generateBankBatch(ai, {
          subjectName,
          gradeLevel,
          topics: task.topicSlice,
          mcqCount: task.mcq,
          essayCount: task.essay,
          difficulty,
        });
        batchResults.push(...generated);
      }

      res.json({
        model: MODEL_NAME,
        questions: batchResults,
      });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({
        error: apiErr.message,
        code: apiErr.code,
      });
    }
  });

  // 2. Endpoint tổng quát cho AIQuestionWizardModal, TabAIQuestions, QuizCreate, AIAssistantPage
  app.post('/api/gemini/generate-questions', async (req: Request, res: Response) => {
    try {
      const { subject = 'Toán Học', topic = 'Kiến thức trọng tâm', count = 4, questionType = 'single_choice', difficulty = 'medium' } = req.body || {};
      const safeCount = Math.max(1, Math.min(20, Number(count) || 4));
      const ai = getGeminiClient();

      const prompt = `Bạn là giáo viên chuyên môn ${subject}. Hãy tạo ${safeCount} câu hỏi tiếng Việt chất lượng cao cho chủ đề "${topic}" (mức độ: ${difficulty}, dạng chính: ${questionType}).
Với công thức toán/lý/hóa hãy đặt trong cặp dấu $...$.
Nếu question_type là "single_choice" hoặc "multiple_choice": tạo đủ 4 phương án A, B, C, D và giải thích chi tiết.
Nếu question_type là "true_false": tạo 2 phương án A (Đúng) và B (Sai).
Nếu question_type là "essay" hoặc "short_answer": options là mảng rỗng [], correct_answer là đáp án chuẩn/hướng dẫn chấm.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question_text: { type: Type.STRING },
                  question_type: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['id', 'text'],
                    },
                  },
                  correct_answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                },
                required: ['question_text', 'question_type', 'options', 'correct_answer', 'explanation', 'points'],
              },
            },
          },
        })
      );

      const parsed = safeJsonParse<unknown[]>((response.text ?? '[]').trim(), []);
      res.json({ model: MODEL_NAME, questions: Array.isArray(parsed) ? parsed : [] });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // 3. Sinh đề bài tập
  app.post('/api/gemini/generate-assignment', async (req: Request, res: Response) => {
    try {
      const { subject, topic, gradeLevel, objectives } = req.body || {};
      const ai = getGeminiClient();

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Soạn một đề bài tập về nhà môn ${subject} lớp ${gradeLevel} cho bài học "${topic}". Mục tiêu: ${objectives || 'Nắm vững kiến thức trọng tâm'}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                points: { type: Type.NUMBER },
              },
              required: ['title', 'description', 'points'],
            },
          },
        })
      );

      res.json(safeJsonParse((response.text ?? '{}').trim(), {}));
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // 4. Soạn giáo án
  app.post('/api/gemini/generate-lesson-plan', async (req: Request, res: Response) => {
    try {
      const { subject, topic, durationMinutes, gradeLevel } = req.body || {};
      const ai = getGeminiClient();

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Soạn giáo án chi tiết môn ${subject} lớp ${gradeLevel} chủ đề "${topic}", thời lượng ${durationMinutes} phút theo công văn 5512 bằng tiếng Việt (định dạng Markdown rõ ràng).`,
        })
      );

      res.json({ content: response.text || '' });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // 5. Nhận xét học sinh
  app.post('/api/gemini/generate-feedback', async (req: Request, res: Response) => {
    try {
      const { studentName, gpa, attendanceRate, behaviorScore, highlights } = req.body || {};
      const ai = getGeminiClient();

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Viết lời nhận xét học bạ ngắn gọn, ấm áp, mang tính sư phạm và động viên cho học sinh ${studentName}. Điểm TB: ${gpa}, chuyên cần: ${attendanceRate}%, điểm hạnh kiểm: ${behaviorScore}.${highlights ? ` Điểm nổi bật: ${highlights}` : ''}`,
        })
      );

      res.json({ content: response.text || '' });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // 6. Tóm tắt tài liệu
  app.post('/api/gemini/summarize-document', async (req: Request, res: Response) => {
    try {
      const { content = '' } = req.body || {};
      const ai = getGeminiClient();

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Tóm tắt tài liệu học tập sau bằng tiếng Việt với các điểm chính và bài học rút ra:\n\n${String(content).substring(0, 6000)}`,
        })
      );

      res.json({ content: response.text || '' });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // 7. Phân tích kết quả lớp học
  app.post('/api/gemini/analyze-results', async (req: Request, res: Response) => {
    try {
      const { data } = req.body || {};
      const ai = getGeminiClient();

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Phân tích ngắn gọn kết quả học tập của lớp học bằng tiếng Việt (Markdown) và đưa ra khuyến nghị sư phạm:\n${JSON.stringify(data || {}).substring(0, 4000)}`,
        })
      );

      res.json({ content: response.text || '' });
    } catch (err) {
      const apiErr = mapGeminiError(err);
      res.status(apiErr.status).json({ error: apiErr.message, code: apiErr.code });
    }
  });

  // Unknown /api/* JSON 404 guard
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found', code: 'NOT_FOUND' });
  });

  // Vite middleware (dev) or static dist serving (production)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    if (process.env.DISABLE_HMR === 'true') {
      app.get('/@vite/client', async (_req: Request, res: Response, next) => {
        try {
          const result = await vite.transformRequest('/@vite/client');
          if (!result?.code) return next();
          const patchedCode = result.code
            .replace('console.debug("[vite] connecting...");', '')
            .replace('transport.connect(createHMRHandler(handleMessage));', '/* HMR disabled */');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.send(patchedCode);
        } catch {
          next();
        }
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Class server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
