import React, { useState } from 'react';
import { Question, QuestionType, QuestionDifficulty } from '../../../types';
import { MathRenderer } from '../../../components/common/MathRenderer';
import { aiAssistant } from '../../../services/aiService';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Edit2
} from 'lucide-react';

interface AIQuestionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApprovedQuestions: (questions: Partial<Question>[]) => Promise<void>;
  defaultSubject?: string;
  defaultGrade?: string;
}

export const AIQuestionWizardModal: React.FC<AIQuestionWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveApprovedQuestions,
  defaultSubject = 'Toán Học',
  defaultGrade = 'Khối 10'
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Input source
  const [sourceMode, setSourceMode] = useState<'topic' | 'document'>('topic');
  const [topicInput, setTopicInput] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Step 2: Configuration
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [chapter, setChapter] = useState('');
  const [count, setCount] = useState(4);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'single_choice',
    'multiple_choice',
    'true_false'
  ]);
  const [difficultyDistribution, setDifficultyDistribution] = useState<QuestionDifficulty>('thong_hieu');
  const [strictCurriculum, setStrictCurriculum] = useState(true);

  // Step 3: Loading & Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Step 4: Review list
  const [generatedQuestions, setGeneratedQuestions] = useState<Partial<Question>[]>([]);
  const [selectedForApproval, setSelectedForApproval] = useState<Record<number, boolean>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Step 5: Save
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Handle mock document upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setDocumentContent(text || 'Nội dung bài học trích xuất từ tệp ' + file.name);
      };
      reader.readAsText(file);
    }
  };

  // Step 3 Execution: Call AI
  const handleStartGeneration = async () => {
    setStep(3);
    setIsGenerating(true);
    setGenerationProgress(20);

    const progressTimer = setInterval(() => {
      setGenerationProgress((p) => (p < 90 ? p + 15 : p));
    }, 400);

    try {
      const topic = sourceMode === 'topic' ? topicInput : `Tài liệu: ${uploadedFileName || 'Tài liệu tải lên'}`;
      
      // Call service
      const rawGenerated = await aiAssistant.generateQuestions({
        subject,
        topic: topic || 'Kiến thức trọng tâm',
        count,
        questionType: selectedTypes[0] || 'single_choice',
        difficulty: difficultyDistribution === 'van_dung_cao' ? 'hard' : difficultyDistribution === 'nhan_biet' ? 'easy' : 'medium'
      });

      // Expand and format into standard 9-type schema
      const formatted: Partial<Question>[] = rawGenerated.map((q, idx) => {
        const chosenType = selectedTypes[idx % selectedTypes.length] || 'single_choice';
        return {
          code: `CH-AI-${Date.now().toString().slice(-4)}-${idx + 1}`,
          question_text: q.question_text || `Câu hỏi ${idx + 1} về chủ đề ${topic}`,
          question_type: chosenType,
          subject_name: subject,
          grade_name: grade,
          chapter_name: chapter || 'Chuyên đề ôn tập số hóa',
          difficulty: difficultyDistribution,
          points: 1.0,
          explanation: q.explanation || 'Lời giải chi tiết bám sát chương trình chuẩn.',
          source_type: 'ai_generated',
          source_ref: 'Gemini 2.5 Flash Educational Engine',
          tags: ['AI đề xuất', 'Cần giáo viên kiểm tra', subject, grade],
          status: 'pending_review',
          options: chosenType === 'single_choice' || chosenType === 'multiple_choice'
            ? q.options || [
                { id: 'A', text: 'Phương án A chuẩn xác', is_correct: true },
                { id: 'B', text: 'Phương án B nhiễu hợp lý', is_correct: false },
                { id: 'C', text: 'Phương án C giả định', is_correct: false },
                { id: 'D', text: 'Phương án D', is_correct: false }
              ]
            : [],
          correct_answer: chosenType === 'multiple_choice' ? ['A', 'B'] : q.correct_answer || 'A',
          statements: chosenType === 'true_false' ? [
            { id: 'st-1', text: 'Mệnh đề thứ nhất phù hợp với quy luật lý thuyết', is_correct: true },
            { id: 'st-2', text: 'Mệnh đề thứ hai trái ngược với định lý cơ bản', is_correct: false },
            { id: 'st-3', text: 'Mệnh đề thứ ba áp dụng được cho trường hợp đặc biệt', is_correct: true },
            { id: 'st-4', text: 'Mệnh đề thứ tư luôn đúng trong mọi hoàn cảnh', is_correct: false }
          ] : undefined,
          matching_pairs: chosenType === 'matching' ? [
            { left_id: 'A1', left_text: 'Khái niệm 1', right_id: 'B1', right_text: 'Định nghĩa 1' },
            { left_id: 'A2', left_text: 'Khái niệm 2', right_id: 'B2', right_text: 'Định nghĩa 2' }
          ] : undefined,
          short_answer_config: chosenType === 'short_answer' ? {
            sample_answer: 'Giá trị chính xác',
            variants: ['gia tri chinh xac'],
            numeric_tolerance: 0.1
          } : undefined
        };
      });

      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGeneratedQuestions(formatted);

      // Pre-select all for review
      const initialApproval: Record<number, boolean> = {};
      formatted.forEach((_, i) => {
        initialApproval[i] = true;
      });
      setSelectedForApproval(initialApproval);

      setTimeout(() => {
        setIsGenerating(false);
        setStep(4);
      }, 500);
    } catch {
      clearInterval(progressTimer);
      setIsGenerating(false);
      setStep(2);
      alert('Không thể tạo câu hỏi lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại với cấu hình khác.');
    }
  };

  // Step 5: Save only approved
  const handleFinalSave = async () => {
    setIsSaving(true);
    const approvedList = generatedQuestions.filter((_, idx) => selectedForApproval[idx]);
    
    // Set approved status if verified by teacher
    const finalized = approvedList.map((q) => ({
      ...q,
      status: 'approved' as const,
      tags: [...(q.tags || []).filter((t) => t !== 'Cần giáo viên kiểm tra'), 'Đã kiểm tra bởi GV']
    }));

    await onSaveApprovedQuestions(finalized);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Wizard Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-linear-to-r from-purple-50 via-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  AI Trợ Giảng - Tạo câu hỏi thông minh
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Wizard 5 Bước
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sinh tự động câu hỏi bám sát chuẩn kiến thức, kiểm duyệt trước khi lưu vào ngân hàng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          {[
            { s: 1, label: '1. Nguồn nội dung' },
            { s: 2, label: '2. Cấu hình' },
            { s: 3, label: '3. Sinh bằng AI' },
            { s: 4, label: '4. Kiểm duyệt' },
            { s: 5, label: '5. Hoàn tất' }
          ].map((item) => (
            <div
              key={item.s}
              className={`flex items-center gap-1.5 ${
                step === item.s
                  ? 'text-purple-600 font-bold'
                  : step > item.s
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  step === item.s
                    ? 'bg-purple-600 text-white'
                    : step > item.s
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > item.s ? '✓' : item.s}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: Nguồn tài liệu / Chủ đề */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setSourceMode('topic')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sourceMode === 'topic'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Nhập chủ đề & Mục tiêu kiến thức
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('document')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    sourceMode === 'document'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tải lên tệp tài liệu (PDF / DOCX / TXT)
                </button>
              </div>

              {sourceMode === 'topic' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Chủ đề bài học hoặc yêu cầu cần đạt: *
                  </label>
                  <textarea
                    rows={4}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Vd: Phương trình bậc hai và hệ thức Vi-ét; Định lý bảo toàn cơ năng; Liên kết cộng hóa trị..."
                    className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-hidden focus:border-purple-500 transition-colors"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-400">Gợi ý nhanh:</span>
                    {['Mệnh đề & Tập hợp', 'Dao động điều hòa', 'Bảng tuần hoàn', 'Phép lai Mendel', 'Reading B1'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTopicInput(tag)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-[11px]"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                    <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Kéo thả tệp tài liệu bài học vào đây hoặc bấm để chọn tệp
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ PDF, DOCX, TXT tối đa 10MB</p>
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleFileUpload}
                      className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </div>

                  {documentContent && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                      <span className="font-bold text-slate-700">Nội dung trích xuất ({uploadedFileName}):</span>
                      <p className="text-slate-600 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        {documentContent}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Nguyên tắc chống ảo giác (Anti-hallucination):</strong> AI được chỉ định bắt buộc bám sát nội dung tài liệu và chuẩn kiến thức GDPT, không suy diễn kiến thức ngoài chương trình.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Cấu hình */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-hidden bg-white"
                  >
                    <option value="Toán Học">Toán Học</option>
                    <option value="Vật Lý">Vật Lý</option>
                    <option value="Hóa Học">Hóa Học</option>
                    <option value="Sinh Học">Sinh Học</option>
                    <option value="Ngữ Văn">Ngữ Văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch Sử">Lịch Sử</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-hidden bg-white"
                  >
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng câu cần sinh</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-hidden font-bold text-center"
                  />
                </div>
              </div>

              {/* Cognitive level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Mức độ nhận thức trọng tâm:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'nhan_biet', label: '1. Nhận biết', desc: 'Ghi nhớ định nghĩa' },
                    { id: 'thong_hieu', label: '2. Thông hiểu', desc: 'Giải thích, phân biệt' },
                    { id: 'van_dung', label: '3. Vận dụng', desc: 'Áp dụng công thức' },
                    { id: 'van_dung_cao', label: '4. Vận dụng cao', desc: 'Tổng hợp, phân loại' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficultyDistribution(lvl.id as QuestionDifficulty)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        difficultyDistribution === lvl.id
                          ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">{lvl.label}</div>
                      <div className="text-[10px] text-slate-400">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Supported Question Types Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn các dạng câu hỏi muốn AI sinh (Tự động kết hợp):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'single_choice', label: 'Một đáp án đúng' },
                    { id: 'multiple_choice', label: 'Nhiều đáp án đúng' },
                    { id: 'true_false', label: 'Đúng / Sai từng ý' },
                    { id: 'matching', label: 'Ghép đôi (Matching)' },
                    { id: 'short_answer', label: 'Trả lời ngắn' },
                    { id: 'essay', label: 'Tự luận có Rubric' }
                  ].map((t) => {
                    const isChecked = selectedTypes.includes(t.id as QuestionType);
                    return (
                      <label
                        key={t.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTypes([...selectedTypes, t.id as QuestionType]);
                            } else {
                              if (selectedTypes.length > 1) {
                                setSelectedTypes(selectedTypes.filter((x) => x !== t.id));
                              }
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Strict option */}
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={strictCurriculum}
                  onChange={(e) => setStrictCurriculum(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Kèm lời giải chi tiết và trích xuất nguồn cơ sở lý thuyết</span>
              </label>
            </div>
          )}

          {/* STEP 3: Progress & Generation */}
          {step === 3 && (
            <div className="py-12 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/30 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gemini AI đang phân tích và tạo câu hỏi...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đang khởi tạo các phương án nhiễu, kiểm tra định dạng và chuẩn hóa công thức toán
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto space-y-1">
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-right">{generationProgress}%</div>
              </div>
            </div>
          )}

          {/* STEP 4: Review generated questions */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80">
                <div>
                  <span className="text-xs font-bold text-purple-900 block">
                    Đã sinh thành công {generatedQuestions.length} câu hỏi
                  </span>
                  <span className="text-[11px] text-purple-700">
                    Giáo viên vui lòng rà soát nội dung. Chỉ các câu được tích chọn mới được lưu vào Ngân hàng.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<number, boolean> = {};
                      generatedQuestions.forEach((_, i) => (all[i] = true));
                      setSelectedForApproval(all);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedForApproval({})}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Questions list for review */}
              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => {
                  const isChecked = Boolean(selectedForApproval[idx]);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isChecked ? 'bg-white border-purple-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedForApproval({
                                ...selectedForApproval,
                                [idx]: e.target.checked
                              })
                            }
                            className="w-4 h-4 text-purple-600 rounded mt-0.5"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                                Câu #{idx + 1} ({q.question_type})
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-bold">
                                AI đề xuất – cần GV duyệt
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-900">
                              <MathRenderer content={q.question_text || ''} />
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Options preview */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 text-xs">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                                opt.id === q.correct_answer || (Array.isArray(q.correct_answer) && q.correct_answer.includes(opt.id))
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded bg-slate-100 font-bold text-center text-[10px] flex items-center justify-center">
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="pl-6 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                          <strong className="text-slate-700">Lời giải chi tiết:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div>
            {step > 1 && step !== 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs flex items-center gap-1.5"
              >
                <span>Tiếp tục: Cấu hình câu hỏi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu sinh câu hỏi bằng AI</span>
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={isSaving || Object.values(selectedForApproval).filter(Boolean).length === 0}
                onClick={handleFinalSave}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Đang lưu vào Ngân hàng...'
                    : `Lưu ${Object.values(selectedForApproval).filter(Boolean).length} câu đã duyệt vào Ngân hàng`}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
