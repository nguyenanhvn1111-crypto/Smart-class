import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { aiAssistant } from '../../services/aiService';
import { LessonTopic, Question, AssignmentQuestionItem, QuestionDifficulty } from '../../types';
import { MathRenderer } from '../../components/common/MathRenderer';
import { Modal } from '../../components/common/Modal';
import {
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
  Send,
  Save,
  X,
  ChevronDown,
  Layers,
  Users,
  AlertTriangle
} from 'lucide-react';

export const AssignmentCreateFromBank: React.FC = () => {
  const navigate = useNavigate();
  const { classes } = useClass();
  const { user } = useAuth();

  // Data sources
  const [allTopics, setAllTopics] = useState<LessonTopic[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  // Form states (1-screen layout)
  const [asgType, setAsgType] = useState<'homework' | 'exam' | 'classwork'>('homework');
  const [title, setTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(['cls-ltai']);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [subjectId, setSubjectId] = useState('sub-math');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 16);
  });
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['top-gemini']);

  // Format, difficulty & question counts
  const [formatType, setFormatType] = useState<'both' | 'mcq_only' | 'essay_only'>('both');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuestionDifficulty>('all');
  const [selectedMcqCount, setSelectedMcqCount] = useState<number>(0);
  const [selectedEssayCount, setSelectedEssayCount] = useState<number>(0);
  const [autoSyncCounts, setAutoSyncCounts] = useState<boolean>(true);

  // Selected questions roster (auto-computed proportionally across selected topics)
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // Exam & assignment settings
  const [pointsMax, setPointsMax] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [shuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions] = useState<boolean>(true);

  // Modals & notifications
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-generate missing questions modal states
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [autoGenSuccessModalOpen, setAutoGenSuccessModalOpen] = useState(false);
  const [autoGenCountGenerated, setAutoGenCountGenerated] = useState(0);
  const [autoGenTier, setAutoGenTier] = useState<'free' | 'paid_pro'>('free');
  const [isProAiPaid, setIsProAiPaid] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load topics & questions
  const loadData = async () => {
    const [tList, qList] = await Promise.all([
      DataService.getLessonTopics(),
      DataService.getQuestions()
    ]);
    setAllTopics(tList);
    setAllQuestions(qList);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Selected classes & student count
  const selectedClasses = useMemo(() => {
    const matched = classes.filter((c) => selectedClassIds.includes(c.id));
    if (matched.length > 0) return matched;
    return classes.slice(0, 1);
  }, [classes, selectedClassIds]);

  const totalStudents = useMemo(() => {
    return selectedClasses.reduce((sum, c) => sum + (c.student_count || 0), 0);
  }, [selectedClasses]);

  const toggleClassSelection = (cId: string) => {
    setSelectedClassIds((prev) => {
      if (prev.includes(cId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== cId);
      }
      return [...prev, cId];
    });
  };

  // Filter topics for the selected classes & subject
  const availableTopics = useMemo(() => {
    let list = allTopics.filter(
      (t) =>
        (selectedClassIds.includes(t.class_id) || selectedClassIds.length === 0) &&
        (subjectId === 'all' || t.subject_id === subjectId) &&
        t.status !== 'archived'
    );
    if (list.length === 0) {
      list = allTopics.filter((t) => t.subject_id === subjectId && t.status !== 'archived');
    }
    if (list.length === 0) {
      list = allTopics.filter((t) => t.status !== 'archived');
    }
    return list;
  }, [allTopics, selectedClassIds, subjectId]);

  // Keep selectedTopicIds aligned with availableTopics when subject/class changes
  useEffect(() => {
    if (availableTopics.length === 0) return;
    const validIds = new Set(availableTopics.map((t) => t.id));
    setSelectedTopicIds((prev) => {
      if (prev.length === 0) return prev;
      const kept = prev.filter((id) => validIds.has(id));
      if (kept.length > 0) return kept;
      return [availableTopics[0].id];
    });
  }, [availableTopics]);

  // Eligible question counts across selected topics
  const eligibleData = useMemo(() => {
    return DataService.getEligibleQuestionsForTopics(selectedTopicIds, {
      difficulty: difficultyFilter,
      formatType
    });
  }, [selectedTopicIds, difficultyFilter, formatType, allTopics, allQuestions]);

  const maxAvailableMcq = formatType === 'essay_only' ? 0 : eligibleData.mcqEligible.length;
  const maxAvailableEssay = formatType === 'mcq_only' ? 0 : eligibleData.essayEligible.length;

  // Thống kê số câu hỏi hợp lệ của từng chủ đề trong danh sách
  const eligibleByTopicId = useMemo(() => {
    const map = new Map<string, { mcq: number; essay: number; total: number }>();
    availableTopics.forEach((topic) => {
      const res = DataService.getEligibleQuestionsForTopics([topic.id], {
        difficulty: difficultyFilter,
        formatType
      });
      const mcq = formatType === 'essay_only' ? 0 : res.mcqEligible.length;
      const essay = formatType === 'mcq_only' ? 0 : res.essayEligible.length;
      map.set(topic.id, { mcq, essay, total: mcq + essay });
    });
    return map;
  }, [availableTopics, difficultyFilter, formatType, allTopics, allQuestions]);

  const mcqShortage = useMemo(() => {
    if (formatType === 'essay_only') return 0;
    return Math.max(0, selectedMcqCount - maxAvailableMcq);
  }, [formatType, selectedMcqCount, maxAvailableMcq]);

  const essayShortage = useMemo(() => {
    if (formatType === 'mcq_only') return 0;
    return Math.max(0, selectedEssayCount - maxAvailableEssay);
  }, [formatType, selectedEssayCount, maxAvailableEssay]);

  const totalShortage = mcqShortage + essayShortage;

  // Tự động cộng tổng chính xác số câu Trắc nghiệm & Tự luận duy nhất từ các chủ đề đang chọn
  useEffect(() => {
    if (!autoSyncCounts) return;
    if (allTopics.length === 0 && allQuestions.length === 0) return;
    if (formatType === 'essay_only') {
      setSelectedMcqCount(0);
      setSelectedEssayCount(eligibleData.essayEligible.length);
    } else if (formatType === 'mcq_only') {
      setSelectedMcqCount(eligibleData.mcqEligible.length);
      setSelectedEssayCount(0);
    } else {
      setSelectedMcqCount(eligibleData.mcqEligible.length);
      setSelectedEssayCount(eligibleData.essayEligible.length);
    }
  }, [
    autoSyncCounts,
    eligibleData.mcqEligible.length,
    eligibleData.essayEligible.length,
    formatType,
    difficultyFilter,
    selectedTopicIds,
    allTopics.length,
    allQuestions.length
  ]);

  // Dynamic select ranges (không bị giới hạn cứng 20 / 10 câu)
  const mcqOptionMax = Math.max(20, maxAvailableMcq, selectedMcqCount);
  const essayOptionMax = Math.max(10, maxAvailableEssay, selectedEssayCount);

  // Percentage per topic fallback
  const topicSharePercent = useMemo(() => {
    const n = selectedTopicIds.length;
    if (n === 0) return 0;
    return 100 % n === 0 ? 100 / n : Number((100 / n).toFixed(1));
  }, [selectedTopicIds.length]);

  // Selection across selected topics (đảm bảo không trùng lặp 100%)
  const proportionalSelection = useMemo(() => {
    return DataService.selectQuestionsProportionally(selectedTopicIds, {
      mcqCount: selectedMcqCount,
      essayCount: selectedEssayCount,
      difficulty: difficultyFilter,
      formatType,
      shuffle: true
    });
  }, [selectedTopicIds, selectedMcqCount, selectedEssayCount, difficultyFilter, formatType, allTopics, allQuestions]);

  useEffect(() => {
    setSelectedQuestions(proportionalSelection.selectedAll);
  }, [proportionalSelection]);

  const allocationByTopicId = useMemo(() => {
    const map = new Map<string, (typeof proportionalSelection.perTopicAllocations)[number]>();
    proportionalSelection.perTopicAllocations.forEach((alloc) => {
      map.set(alloc.topicId, alloc);
    });
    return map;
  }, [proportionalSelection]);

  const isUniformAllocation = useMemo(() => {
    const allocs = proportionalSelection.perTopicAllocations;
    if (allocs.length <= 1) return true;
    const firstPct = allocs[0].sharePercent;
    return allocs.every((a) => a.sharePercent === firstPct);
  }, [proportionalSelection.perTopicAllocations]);

  const reselectProportionally = () => {
    const fresh = DataService.selectQuestionsProportionally(selectedTopicIds, {
      mcqCount: selectedMcqCount,
      essayCount: selectedEssayCount,
      difficulty: difficultyFilter,
      formatType,
      shuffle: true
    });
    setSelectedQuestions(fresh.selectedAll);
    showToast('success', 'Đã trộn lại câu hỏi chia đều theo các chủ đề đã chọn.');
  };

  const handleSwapQuestion = (targetQId: string) => {
    const targetQ = selectedQuestions.find((q) => q.id === targetQId);
    if (!targetQ) return;

    const isEssay = targetQ.question_type === 'essay' || targetQ.question_type === 'short_answer';
    const currentSelectedIds = new Set(selectedQuestions.map((q) => q.id));

    const candidatePool = (isEssay ? eligibleData.essayEligible : eligibleData.mcqEligible).filter(
      (q) => !currentSelectedIds.has(q.id)
    );

    if (candidatePool.length === 0) {
      showToast('error', 'Không còn câu hỏi thay thế nào khác trong các chủ đề đã chọn.');
      return;
    }

    const replacement = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    setSelectedQuestions((prev) => prev.map((q) => (q.id === targetQId ? replacement : q)));
    showToast('success', `Đã đổi câu ${targetQ.code || targetQ.id} sang ${replacement.code || replacement.id}.`);
  };

  const subjectMap: Record<string, string> = {
    'sub-math': 'Toán Học',
    'sub-lit': 'Ngữ Văn',
    'sub-eng': 'Tiếng Anh',
    'sub-phys': 'Vật Lý',
    'sub-chem': 'Hóa Học',
    'sub-info': 'Tin Học'
  };

  const handleTriggerSubmit = (status: 'published' | 'draft') => {
    if (!title.trim()) {
      showToast('error', 'Vui lòng nhập tiêu đề bài tập / kiểm tra.');
      return;
    }
    if (selectedTopicIds.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất 1 chủ đề trong mục Liên kết với chủ đề môn học.');
      return;
    }
    if (totalShortage > 0) {
      setIsAutoGenerateModalOpen(true);
      return;
    }
    if (selectedQuestions.length === 0) {
      showToast('error', 'Chưa có câu hỏi nào được chọn cho đề bài.');
      return;
    }
    if (status === 'draft') {
      handleFinalSubmit('draft');
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  // Final Submit / Publish or Draft
  const handleFinalSubmit = async (status: 'published' | 'draft') => {
    if (selectedQuestions.length === 0) {
      showToast('error', 'Đề bài chưa có câu hỏi nào. Vui lòng kiểm tra lại cấu hình.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subjName = subjectMap[subjectId] || 'Toán Học';
      const pointPerQuestion = Math.round((pointsMax / selectedQuestions.length) * 10) / 10;

      const questionItems: AssignmentQuestionItem[] = selectedQuestions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        type:
          q.question_type === 'essay' || q.question_type === 'short_answer'
            ? 'essay'
            : 'multiple_choice',
        options: q.options?.map((opt) => `${opt.id}. ${opt.text}`),
        correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : 'A',
        explanation: q.explanation,
        points: pointPerQuestion
      }));

      for (const targetClassId of selectedClassIds) {
        const cls = classes.find((c) => c.id === targetClassId);
        await DataService.createAssignment({
          class_id: targetClassId,
          class_name: cls?.name || '10A1',
          subject_id: subjectId,
          subject_name: subjName,
          teacher_id: user?.id || 'user-teacher-1',
          teacher_name: user?.full_name || 'Cô Trần Thị Mai',
          title: title.trim() || `${asgType === 'exam' ? 'Bài kiểm tra' : 'Bài tập'}: ${subjName}`,
          description: 'Hoàn thành các câu hỏi trong đề và nộp bài trước hạn.',
          type: asgType === 'classwork' ? 'homework' : asgType,
          topic_ids: selectedTopicIds,
          question_selection_mode: 'random',
          format_type: formatType,
          mcq_count: selectedMcqCount,
          essay_count: selectedEssayCount,
          difficulty_filter: difficultyFilter,
          duration_minutes: asgType === 'exam' ? durationMinutes : 0,
          max_attempts: 1,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
          show_answers_mode: 'after_submit',
          due_date: new Date(dueDate).toISOString(),
          points_max: pointsMax,
          status,
          allow_late: true,
          total_questions: questionItems.length,
          questions: questionItems,
          is_from_question_bank: true
        });
      }

      setIsConfirmModalOpen(false);
      showToast(
        'success',
        status === 'published'
          ? `Giao bài tập "${title || 'Mới'}" cho ${selectedClasses.map((c) => c.name).join(', ')} thành công!`
          : `Lưu bản nháp bài tập "${title || 'Mới'}" thành công!`
      );

      setTimeout(() => {
        navigate('/teacher/assignments');
      }, 1200);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi giao bài tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate missing questions and distribute proportionally across selected topics
  const handleAutoGenerateQuestions = async () => {
    if (totalShortage <= 0) return;

    if (autoGenTier === 'paid_pro' && !isProAiPaid) {
      showToast('error', 'Vui lòng kích hoạt bản quyền AI Pro VIP hoặc chọn tạo khung Miễn phí.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetTopics = allTopics.filter((t) => selectedTopicIds.includes(t.id));
      const firstTopic = targetTopics[0];
      const subjName = subjectMap[subjectId] || firstTopic?.subject_name || 'Toán Học';
      const gradeLevel =
        selectedClasses.map((c) => c.name).filter(Boolean).join(', ') || 'Lớp 10';

      const newQuestions: Partial<Question>[] = [];
      const assignedTopicIds: string[] = [];

      // Distribute generated questions across topics prioritized by proportional deficit
      const pickTargetTopic = (kind: 'mcq' | 'essay', seqIdx: number): LessonTopic | undefined => {
        if (targetTopics.length === 0) return firstTopic;
        const allocs = proportionalSelection.perTopicAllocations;
        if (allocs.length > 0) {
          const sorted = [...allocs].sort((a, b) => {
            const defA = kind === 'mcq' ? a.targetMcq - a.availableMcq : a.targetEssay - a.availableEssay;
            const defB = kind === 'mcq' ? b.targetMcq - b.availableMcq : b.targetEssay - b.availableEssay;
            return defB - defA;
          });
          const pickedAlloc = sorted[seqIdx % sorted.length];
          const matched = targetTopics.find((t) => t.id === pickedAlloc.topicId);
          if (matched) return matched;
        }
        return targetTopics[seqIdx % targetTopics.length];
      };

      if (autoGenTier === 'paid_pro' && isProAiPaid) {
        const aiResult = await aiAssistant.generateBankQuestions({
          subjectName: subjName,
          gradeLevel,
          topics:
            targetTopics.length > 0
              ? targetTopics.map((t) => ({
                  id: t.id,
                  title: t.title,
                  content: t.content
                }))
              : [{ title: title.trim() || 'Kiến thức trọng tâm bài học' }],
          mcqCount: mcqShortage,
          essayCount: essayShortage,
          difficulty: difficultyFilter
        });

        let mcqSeq = 0;
        let essaySeq = 0;
        aiResult.questions.forEach((item, idx) => {
          const isEssay = item.question_kind === 'essay';
          const codeNum = 2000 + Math.floor(Math.random() * 7000) + idx;
          const assignedTopic = isEssay ? pickTargetTopic('essay', essaySeq++) : pickTargetTopic('mcq', mcqSeq++);
          const matchedTopic =
            targetTopics.find((t) => t.title === item.topic_title) || assignedTopic || firstTopic;

          if (matchedTopic) assignedTopicIds.push(matchedTopic.id);

          newQuestions.push({
            code: `${isEssay ? 'TL' : 'CH'}-AI-${codeNum}`,
            teacher_id: user?.id || 'user-teacher-1',
            teacher_name: user?.full_name || 'Cô Trần Thị Mai',
            subject_id: subjectId,
            subject_name: subjName,
            topic_name: matchedTopic?.title || item.topic_title || 'Chủ đề bài học',
            difficulty:
              item.difficulty ||
              (difficultyFilter !== 'all'
                ? (difficultyFilter as QuestionDifficulty)
                : isEssay
                ? 'van_dung'
                : 'thong_hieu'),
            question_text: item.question_text,
            question_type: isEssay ? 'essay' : 'single_choice',
            options: isEssay ? [] : item.options,
            correct_answer: item.correct_answer,
            explanation: item.explanation,
            points: isEssay ? 2.0 : 1.0,
            status: 'pending_review',
            source_type: 'ai_generated',
            source_ref: `Gemini AI (${aiResult.model || 'gemini-4-hydrogen'})`
          });
        });
      } else {
        for (let i = 0; i < mcqShortage; i++) {
          const topicForQ = pickTargetTopic('mcq', i) || firstTopic;
          const codeNum = 2000 + Math.floor(Math.random() * 8000);
          if (topicForQ) assignedTopicIds.push(topicForQ.id);
          newQuestions.push({
            code: `CH-TAY-${codeNum}`,
            teacher_id: user?.id || 'user-teacher-1',
            teacher_name: user?.full_name || 'Cô Trần Thị Mai',
            subject_id: subjectId,
            subject_name: subjName,
            topic_name: topicForQ?.title || 'Chủ đề bài học',
            difficulty: difficultyFilter !== 'all' ? (difficultyFilter as QuestionDifficulty) : 'thong_hieu',
            question_text: `[Câu hỏi trắc nghiệm tự tạo ${i + 1} - Chủ đề: ${topicForQ?.title || 'Bài học'}] (Bản Miễn phí: Thầy/Cô vui lòng vào Ngân hàng câu hỏi để sửa nội dung và 4 phương án bằng tay)`,
            question_type: 'single_choice',
            options: [
              { id: 'A', text: '[Phương án A - Sửa bằng tay]', is_correct: true },
              { id: 'B', text: '[Phương án B - Sửa bằng tay]', is_correct: false },
              { id: 'C', text: '[Phương án C - Sửa bằng tay]', is_correct: false },
              { id: 'D', text: '[Phương án D - Sửa bằng tay]', is_correct: false }
            ],
            correct_answer: 'A',
            explanation: 'Ghi chú: Thầy/Cô cần vào tab "Câu hỏi chưa duyệt" trong Ngân hàng câu hỏi để sửa nội dung và bấm duyệt trước khi đưa vào bài tập.',
            points: 1.0,
            status: 'pending_review',
            source_type: 'teacher_composed'
          });
        }

        for (let j = 0; j < essayShortage; j++) {
          const topicForQ = pickTargetTopic('essay', j) || firstTopic;
          const codeNum = 5000 + Math.floor(Math.random() * 4000);
          if (topicForQ) assignedTopicIds.push(topicForQ.id);
          newQuestions.push({
            code: `TL-TAY-${codeNum}`,
            teacher_id: user?.id || 'user-teacher-1',
            teacher_name: user?.full_name || 'Cô Trần Thị Mai',
            subject_id: subjectId,
            subject_name: subjName,
            topic_name: topicForQ?.title || 'Chủ đề bài học',
            difficulty: difficultyFilter !== 'all' ? (difficultyFilter as QuestionDifficulty) : 'van_dung',
            question_text: `[Câu hỏi tự luận tự tạo ${j + 1} - Chủ đề: ${topicForQ?.title || 'Bài học'}] (Bản Miễn phí: Thầy/Cô vui lòng vào Ngân hàng câu hỏi để nhập đề bài tự luận và biểu điểm bằng tay)`,
            question_type: 'essay',
            options: [],
            correct_answer: 'Vui lòng bổ sung đáp án mẫu và thang điểm bằng tay.',
            explanation: 'Ghi chú: Thầy/Cô cần vào tab "Câu hỏi chưa duyệt" trong Ngân hàng câu hỏi để sửa nội dung và bấm duyệt.',
            points: 2.0,
            status: 'pending_review',
            source_type: 'teacher_composed'
          });
        }
      }

      const batchResult = await DataService.batchCreateQuestions(newQuestions);
      const createdQuestions = batchResult.questions;

      // Link each created question to its assigned topic
      const qIdsByTopic = new Map<string, string[]>();
      createdQuestions.forEach((q, idx) => {
        const tId = assignedTopicIds[idx] || firstTopic?.id;
        if (!tId) return;
        const list = qIdsByTopic.get(tId) || [];
        list.push(q.id);
        qIdsByTopic.set(tId, list);
      });

      for (const t of targetTopics) {
        const addedForTopic = qIdsByTopic.get(t.id) || [];
        if (addedForTopic.length > 0) {
          await DataService.updateLessonTopic(t.id, {
            question_ids: Array.from(new Set([...(t.question_ids || []), ...addedForTopic]))
          });
        }
      }

      const updatedQs = await DataService.getQuestions();
      setAllQuestions(updatedQs);

      setAutoGenCountGenerated(newQuestions.length);
      setIsAutoGenerateModalOpen(false);
      setAutoGenSuccessModalOpen(true);
      showToast('success', `Đã tạo ${newQuestions.length} câu hỏi ở trạng thái CHƯA DUYỆT thành công!`);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi tạo câu hỏi tự động.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all whitespace-nowrap ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb Bar (1 line) */}
      <div className="flex items-center justify-between gap-3 text-xs bg-slate-50/80 py-2.5 px-4 rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 text-slate-500 min-w-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => navigate('/teacher/modules')}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Dạy &amp; Học</span>
          </button>
          <span className="text-slate-400 shrink-0">&gt;</span>
          <button
            type="button"
            onClick={() => navigate('/teacher/assignments')}
            className="hover:text-blue-600 transition-colors font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            Giao bài tập
          </button>
          <span className="text-slate-400 shrink-0">&gt;</span>
          <span className="font-bold text-slate-800 truncate whitespace-nowrap">
            Tạo bài tập từ NHCH • Tạo bài tập &amp; Kiểm tra từ Ngân hàng câu hỏi
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/teacher/assignments')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Quay lại danh sách</span>
        </button>
      </div>

      {/* ================= SINGLE SCREEN COMPACT CONTAINER WITH VERTICAL SCROLLBAR ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs max-h-[calc(100vh-11.5rem)] overflow-y-auto p-4 sm:p-5 space-y-3.5">
        {/* HÀNG 1: Loại bài tập | Lớp nhận bài | Môn học */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start text-xs">
          {/* Cột 1: Loại bài tập * */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Loại bài tập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={asgType}
                onChange={(e) => setAsgType(e.target.value as any)}
                className="w-full appearance-none px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all pr-8 whitespace-nowrap"
              >
                <option value="homework">Bài tập về nhà</option>
                <option value="exam">Bài kiểm tra</option>
                <option value="classwork">Luyện tập trên lớp</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Cột 2: Lớp nhận bài * */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between gap-2 whitespace-nowrap">
              <label className="font-bold text-slate-700 whitespace-nowrap">
                Lớp nhận bài <span className="text-rose-500">*</span>{' '}
                <span className="text-[11px] text-cyan-600 font-semibold">(Chọn nhiều lớp)</span>
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">
                {selectedClassIds.length}/{classes.length || 7} Lớp
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className="w-full text-left px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all flex items-center justify-between whitespace-nowrap"
              >
                <span className="flex items-center gap-2 min-w-0 truncate whitespace-nowrap">
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate whitespace-nowrap">
                    {selectedClasses.length === 1
                      ? selectedClasses[0].name
                      : `${selectedClasses.length} lớp (${selectedClasses.map((c) => c.name).join(', ')})`}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    isClassDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isClassDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsClassDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-2 max-h-56 overflow-y-auto space-y-1">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1 mb-1 whitespace-nowrap">
                      <span>Chọn các lớp nhận bài</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedClassIds.length === classes.length) {
                            setSelectedClassIds([classes[0]?.id || 'cls-ltai']);
                          } else {
                            setSelectedClassIds(classes.map((c) => c.id));
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 capitalize font-bold text-[10px] whitespace-nowrap"
                      >
                        {selectedClassIds.length === classes.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                      </button>
                    </div>

                    {classes.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <div
                          key={cls.id}
                          onClick={() => toggleClassSelection(cls.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-colors whitespace-nowrap ${
                            isChecked
                              ? 'bg-blue-50/80 text-blue-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <span className="truncate whitespace-nowrap">{cls.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                            {cls.student_count || 0} HS
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cột 3: Môn học * */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Môn học <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={subjectId}
                onChange={(e) => {
                  setAutoSyncCounts(true);
                  setSubjectId(e.target.value);
                }}
                className="w-full appearance-none px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all pr-8 whitespace-nowrap"
              >
                <option value="sub-math">Toán học</option>
                <option value="sub-lit">Ngữ Văn</option>
                <option value="sub-eng">Tiếng Anh</option>
                <option value="sub-phys">Vật Lý</option>
                <option value="sub-chem">Hóa học</option>
                <option value="sub-info">Tin học</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* HÀNG 1b: Lớp được phân phối (1 dòng gọn) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap">
          <span className="font-medium shrink-0 whitespace-nowrap">
            Lớp được phân phối ({selectedClassIds.length} lớp - {totalStudents} HS):
          </span>
          {selectedClasses.map((cls) => (
            <span
              key={cls.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-[11px] shrink-0 whitespace-nowrap"
            >
              <span>{cls.name} ({cls.student_count || 0} HS)</span>
              {selectedClassIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => toggleClassSelection(cls.id)}
                  className="text-cyan-600 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* HÀNG 2: Tiêu đề bài tập / Kiểm tra * */}
        <div className="space-y-1 text-xs">
          <label className="block font-bold text-slate-700 whitespace-nowrap">
            Tiêu đề bài tập / Kiểm tra <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Kiểm tra 15 phút - Hệ phương trình bậc nhất..."
            className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal text-xs"
            required
          />
        </div>

        {/* HÀNG 3: Liên kết với chủ đề môn học (Vertical scrollbar + Tự động tính tổng & lọc trùng) */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-blue-600 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Liên kết với chủ đề môn học</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span>
                Đã chọn <b className="text-blue-600">{selectedTopicIds.length}</b> chủ đề
                {selectedTopicIds.length > 0 && (
                  <span className="text-cyan-700 font-bold ml-1">
                    {isUniformAllocation
                      ? `(Phân bổ đều: ${proportionalSelection.perTopicAllocations[0]?.sharePercent ?? topicSharePercent}% mỗi chủ đề)`
                      : `(Tổng ${maxAvailableMcq} TN${formatType === 'both' || formatType === 'essay_only' ? ` • ${maxAvailableEssay} TL` : ''} duy nhất)`}
                  </span>
                )}
              </span>
              {availableTopics.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setAutoSyncCounts(true);
                    if (selectedTopicIds.length === availableTopics.length) {
                      setSelectedTopicIds([]);
                    } else {
                      setSelectedTopicIds(availableTopics.map((t) => t.id));
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold text-[10px] border border-slate-200 cursor-pointer transition-colors"
                >
                  {selectedTopicIds.length === availableTopics.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>
          </div>

          {eligibleData.stats.totalDuplicatesRemoved > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-cyan-50/80 border border-cyan-200 text-cyan-900 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium">
                Hệ thống đã tự động lọc bỏ <b>{eligibleData.stats.totalDuplicatesRemoved} câu hỏi trùng lặp</b> xuất hiện ở nhiều chủ đề để chỉ tính duy nhất 1 lần
                {eligibleData.stats.duplicateMcqRemoved > 0 && eligibleData.stats.duplicateEssayRemoved > 0
                  ? ` (${eligibleData.stats.duplicateMcqRemoved} TN, ${eligibleData.stats.duplicateEssayRemoved} TL).`
                  : '.'}
              </span>
              <span className="font-bold text-cyan-800 shrink-0 whitespace-nowrap">
                Chính xác: {maxAvailableMcq} TN{formatType === 'both' || formatType === 'essay_only' ? ` • ${maxAvailableEssay} TL` : ''}
              </span>
            </div>
          )}

          {availableTopics.length > 0 ? (
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {availableTopics.map((topic) => {
                const isSelected = selectedTopicIds.includes(topic.id);
                const alloc = allocationByTopicId.get(topic.id);
                const pickedTotal = alloc ? alloc.selectedMcq + alloc.selectedEssay : 0;
                const topicStats = eligibleByTopicId.get(topic.id) || { mcq: 0, essay: 0, total: 0 };

                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      setAutoSyncCounts(true);
                      setSelectedTopicIds((prev) =>
                        prev.includes(topic.id)
                          ? prev.filter((id) => id !== topic.id)
                          : [...prev, topic.id]
                      );
                    }}
                    className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-50/40 border-cyan-500 text-slate-900 shadow-2xs ring-1 ring-cyan-500/30'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 shrink-0 cursor-pointer"
                      />
                      <span className="font-bold text-xs truncate text-slate-800 whitespace-nowrap">
                        {topic.title}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1.5 whitespace-nowrap">
                      {!isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] whitespace-nowrap">
                          {topicStats.mcq} TN{topicStats.essay > 0 ? ` • ${topicStats.essay} TL` : ''}
                        </span>
                      )}
                      {isSelected && alloc && (
                        <>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-[10px] whitespace-nowrap">
                            {alloc.sharePercent}% • {pickedTotal} câu
                            {topicStats.total !== pickedTotal ? ` / ${topicStats.total} gốc` : ''}
                          </span>
                          {alloc.overlapCount > 0 && (
                            <span
                              title={`Có ${alloc.overlapCount} câu trùng lặp với chủ đề khác đã được lọc bỏ khi gộp`}
                              className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px] whitespace-nowrap"
                            >
                              Trùng {alloc.overlapCount}
                            </span>
                          )}
                        </>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] whitespace-nowrap">
                        Buổi {topic.period_number || 1}
                      </span>
                      {topic.session_date && (
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(topic.session_date).toISOString().slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs whitespace-nowrap">
              <span className="font-bold text-slate-700 truncate">
                Chưa tìm thấy chủ đề phù hợp cho môn học này
              </span>
              <button
                type="button"
                onClick={() => navigate('/teacher/assignments/topics')}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 cursor-pointer shrink-0 whitespace-nowrap"
              >
                Quản lý chủ đề
              </button>
            </div>
          )}
        </div>

        {/* HÀNG 4: Dạng bài / Hình thức câu hỏi * | Độ khó câu hỏi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Dạng bài / Hình thức câu hỏi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formatType}
                onChange={(e) => {
                  setAutoSyncCounts(true);
                  setFormatType(e.target.value as any);
                }}
                className="w-full appearance-none px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer pr-8 whitespace-nowrap"
              >
                <option value="both">Kết hợp Trắc nghiệm &amp; Tự luận</option>
                <option value="mcq_only">Chỉ Trắc nghiệm</option>
                <option value="essay_only">Chỉ Tự luận</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Độ khó câu hỏi
            </label>
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setAutoSyncCounts(true);
                  setDifficultyFilter(e.target.value as any);
                }}
                className="w-full appearance-none px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer pr-8 whitespace-nowrap"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="nhan_biet">Nhận biết (Dễ)</option>
                <option value="thong_hieu">Thông hiểu (Trung bình)</option>
                <option value="van_dung">Vận dụng (Khó)</option>
                <option value="van_dung_cao">Vận dụng cao</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* HÀNG 5: Số câu Trắc nghiệm & Số câu Tự luận (Tự động cộng tổng không trùng từ các chủ đề) */}
        <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-xs">
          {!autoSyncCounts && (selectedMcqCount !== maxAvailableMcq || selectedEssayCount !== maxAvailableEssay) && (
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80 text-[11px]">
              <span className="text-slate-600 font-medium">
                Đang tùy chỉnh số lượng câu hỏi thủ công.
              </span>
              <button
                type="button"
                onClick={() => setAutoSyncCounts(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đồng bộ tổng từ chủ đề ({maxAvailableMcq} TN{formatType === 'both' || formatType === 'essay_only' ? ` / ${maxAvailableEssay} TL` : ''})</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(formatType === 'both' || formatType === 'mcq_only') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <label className="font-bold text-slate-700 whitespace-nowrap">
                    Số câu Trắc nghiệm
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                    Hợp lệ: {maxAvailableMcq} / Đang chọn: {selectedMcqCount}
                    {eligibleData.stats.duplicateMcqRemoved > 0 && (
                      <span className="text-cyan-700 ml-1">
                        (Đã lọc {eligibleData.stats.duplicateMcqRemoved} trùng)
                      </span>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={selectedMcqCount}
                    onChange={(e) => {
                      setAutoSyncCounts(false);
                      setSelectedMcqCount(Number(e.target.value));
                    }}
                    className={`w-full appearance-none px-3 py-2 bg-white border rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer pr-8 whitespace-nowrap ${
                      mcqShortage > 0 ? 'border-amber-400' : 'border-slate-200'
                    }`}
                  >
                    <option value={0}>0 câu trắc nghiệm</option>
                    {Array.from({ length: mcqOptionMax }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} câu trắc nghiệm {num > maxAvailableMcq ? `(Thiếu ${num - maxAvailableMcq})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {mcqShortage > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Thiếu {mcqShortage} câu trắc nghiệm</span>
                  </div>
                )}
              </div>
            )}

            {(formatType === 'both' || formatType === 'essay_only') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <label className="font-bold text-slate-700 whitespace-nowrap">
                    Số câu Tự luận
                  </label>
                  <span className="text-[11px] font-bold text-purple-700 whitespace-nowrap">
                    Hợp lệ: {maxAvailableEssay} / Đang chọn: {selectedEssayCount}
                    {eligibleData.stats.duplicateEssayRemoved > 0 && (
                      <span className="text-cyan-700 ml-1">
                        (Đã lọc {eligibleData.stats.duplicateEssayRemoved} trùng)
                      </span>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={selectedEssayCount}
                    onChange={(e) => {
                      setAutoSyncCounts(false);
                      setSelectedEssayCount(Number(e.target.value));
                    }}
                    className={`w-full appearance-none px-3 py-2 bg-white border rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer pr-8 whitespace-nowrap ${
                      essayShortage > 0 ? 'border-amber-400' : 'border-slate-200'
                    }`}
                  >
                    <option value={0}>0 câu tự luận</option>
                    {Array.from({ length: essayOptionMax }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} câu tự luận {num > maxAvailableEssay ? `(Thiếu ${num - maxAvailableEssay})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {essayShortage > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Thiếu {essayShortage} câu tự luận</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* HÀNG 6: Banner tạo câu hỏi tự động khi thiếu câu */}
        {totalShortage > 0 && (
          <div className="p-2.5 px-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-amber-900 truncate whitespace-nowrap">
                Ngân hàng trong các chủ đề được chọn hiện thiếu {totalShortage} câu hỏi. Nhấn nút để tự động tạo bổ sung.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoGenerateModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Tạo thêm {totalShortage} câu hỏi tự động</span>
            </button>
          </div>
        )}

        {/* HÀNG 7: Thời hạn nộp bài | Thang điểm | Thời gian làm bài (1 dòng gọn) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Thời hạn nộp bài <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Thang điểm tối đa
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={pointsMax}
              onChange={(e) => setPointsMax(Math.max(1, Number(e.target.value) || 10))}
              className="w-full px-3 py-1.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700 whitespace-nowrap">
              Thời gian làm bài
            </label>
            <div className="relative">
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full appearance-none px-3 py-1.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer pr-8 whitespace-nowrap"
              >
                <option value={0}>Không giới hạn (BTVN)</option>
                <option value={15}>15 phút</option>
                <option value={45}>45 phút (1 tiết)</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút (2 tiết)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS (1 dòng gọn) */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              disabled={selectedQuestions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Xem trước &amp; Đổi câu ({selectedQuestions.length} câu)</span>
            </button>
            {selectedTopicIds.length > 0 && (
              <span className="hidden lg:inline-block text-[11px] font-medium text-slate-500 truncate whitespace-nowrap">
                {isUniformAllocation
                  ? `Phân bổ đều ${proportionalSelection.perTopicAllocations[0]?.sharePercent ?? topicSharePercent}%/chủ đề (${selectedTopicIds.length} chủ đề)`
                  : `Tổng ${selectedQuestions.length} câu duy nhất từ ${selectedTopicIds.length} chủ đề`}
                {eligibleData.stats.totalDuplicatesRemoved > 0
                  ? ` • Đã lọc ${eligibleData.stats.totalDuplicatesRemoved} câu trùng`
                  : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => navigate('/teacher/assignments')}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSubmit('draft')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>Lưu nháp</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSubmit('published')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Giao bài tập ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: XEM TRƯỚC & ĐỔI CÂU HỎI ĐÃ CHỌN ================= */}
      {isPreviewModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Xem trước đề bài (${selectedQuestions.length} câu hỏi)`}
          subtitle={
            isUniformAllocation
              ? `Phân bổ đều ${proportionalSelection.perTopicAllocations[0]?.sharePercent ?? topicSharePercent}% cho mỗi chủ đề trong ${selectedTopicIds.length} chủ đề đã chọn`
              : `Tổng hợp ${selectedQuestions.length} câu hỏi duy nhất từ ${selectedTopicIds.length} chủ đề đã chọn`
          }
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Bảng tóm tắt tỷ lệ phân bổ theo chủ đề */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between whitespace-nowrap">
                <span className="font-bold text-slate-800">Tỷ lệ chọn câu hỏi theo chủ đề:</span>
                <button
                  type="button"
                  onClick={reselectProportionally}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Trộn lại đề</span>
                </button>
              </div>
              {eligibleData.stats.totalDuplicatesRemoved > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-semibold">
                  Đã tự động lọc bỏ {eligibleData.stats.totalDuplicatesRemoved} câu hỏi trùng lặp giữa các chủ đề (mỗi câu chỉ xuất hiện 1 lần).
                </div>
              )}
              <div className="space-y-1">
                {proportionalSelection.perTopicAllocations.map((alloc) => (
                  <div
                    key={alloc.topicId}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200/80 whitespace-nowrap"
                  >
                    <span className="font-semibold text-slate-800 truncate">{alloc.topicTitle}</span>
                    <span className="text-[11px] font-bold text-blue-700 shrink-0">
                      {alloc.sharePercent}% • {alloc.selectedMcq} TN / {alloc.selectedEssay} TL
                      {alloc.overlapCount > 0 ? ` (giao thoa ${alloc.overlapCount})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh sách câu hỏi đã chọn */}
            <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
              {selectedQuestions.map((q, idx) => {
                const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';
                return (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                          {q.code || q.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                            isEssay ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                        </span>
                        {q.topic_name && (
                          <span className="text-[11px] text-slate-500 truncate">{q.topic_name}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwapQuestion(q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Đổi câu</span>
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-900">
                      <MathRenderer content={q.question_text} />
                    </div>

                    {!isEssay && q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                              q.correct_answer === opt.id ||
                              (Array.isArray(q.correct_answer) && q.correct_answer.includes(opt.id))
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {opt.id}
                            </span>
                            <MathRenderer content={opt.text} inline />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL XÁC NHẬN GIAO BÀI ================= */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Xác nhận phát hành bài tập cho lớp"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500">Tên bài:</span>
                <span className="font-bold text-slate-900 truncate">{title}</span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500">Lớp nhận bài:</span>
                <span className="font-extrabold text-blue-700 truncate">
                  {selectedClasses.map((c) => c.name).join(', ')}
                </span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500">Số lượng học sinh nhận đề:</span>
                <span className="font-bold text-slate-800">{totalStudents} học sinh</span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500">Phân bổ chủ đề:</span>
                <span className="font-bold text-cyan-700">
                  {selectedTopicIds.length} chủ đề{' '}
                  {isUniformAllocation
                    ? `(${proportionalSelection.perTopicAllocations[0]?.sharePercent ?? topicSharePercent}% / chủ đề)`
                    : `(Đã lọc ${eligibleData.stats.totalDuplicatesRemoved} trùng)`}
                </span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Hạn nộp bài:
                </span>
                <span className="font-bold text-rose-600">
                  {new Date(dueDate).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-slate-500">Số câu hỏi:</span>
                <span className="font-bold text-slate-800">
                  {selectedQuestions.length} câu ({pointsMax} điểm)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('published')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang phát hành...' : 'Xác nhận giao bài'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: TẠO THÊM CÂU HỎI TỰ ĐỘNG BỔ SUNG ================= */}
      {isAutoGenerateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAutoGenerateModalOpen(false)}
          title={`Tạo thêm câu hỏi tự động (${totalShortage} câu thiếu)`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between whitespace-nowrap">
                <span className="text-slate-500">Số câu trắc nghiệm cần tạo:</span>
                <span className="font-extrabold text-blue-700 text-sm">{mcqShortage} câu</span>
              </div>
              <div className="flex items-center justify-between whitespace-nowrap">
                <span className="text-slate-500">Số câu tự luận cần tạo:</span>
                <span className="font-extrabold text-purple-700 text-sm">{essayShortage} câu</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 whitespace-nowrap">
                <span className="font-bold text-slate-700">Tổng cộng cần tạo thêm:</span>
                <span className="font-black text-rose-600 text-sm">{totalShortage} câu hỏi</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="font-extrabold text-slate-800 text-xs block">
                Chọn phương thức tạo câu hỏi:
              </span>

              <div
                onClick={() => setAutoGenTier('free')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  autoGenTier === 'free'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={autoGenTier === 'free'}
                      onChange={() => setAutoGenTier('free')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-bold text-slate-900 text-xs">
                      Tạo khung câu hỏi mẫu (Miễn phí / Chưa trả tiền)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                    Miễn phí
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6 leading-relaxed">
                  Hệ thống tạo nhanh <b>{totalShortage} câu hỏi khung chưa duyệt</b> gắn vào các chủ đề đã chọn.
                </p>
              </div>

              <div
                onClick={() => setAutoGenTier('paid_pro')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  autoGenTier === 'paid_pro'
                    ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={autoGenTier === 'paid_pro'}
                      onChange={() => setAutoGenTier('paid_pro')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Tự động sinh nội dung bằng AI (Gói trả phí)</span>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xs whitespace-nowrap">
                    AI PRO VIP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 pl-6 leading-relaxed">
                  AI sẽ tự động sinh toàn bộ nội dung đề bài, 4 phương án, đáp án đúng và lời giải chi tiết bám sát 100% các chủ đề đã chọn.
                </p>

                {autoGenTier === 'paid_pro' && !isProAiPaid && (
                  <div className="mt-3 ml-6 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-amber-900 block">
                      Chưa kích hoạt gói SmartClass AI Pro (99.000đ/tháng)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProAiPaid(true);
                        showToast('success', 'Đã kích hoạt gói SmartClass AI Pro thành công!');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-lg shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Kích hoạt bản quyền AI Pro (Trải nghiệm ngay)</span>
                    </button>
                  </div>
                )}

                {autoGenTier === 'paid_pro' && isProAiPaid && (
                  <div className="mt-3 ml-6 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tài khoản đã kích hoạt AI Pro VIP: Sẵn sàng tự động sinh nội dung!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-700 space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Quy trình bắt buộc sau khi tạo:</span>
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Khi bấm tạo, các câu hỏi sẽ ở trạng thái <b>CHƯA DUYỆT</b>. Thầy/Cô phải qua <b>Ngân hàng câu hỏi</b> để duyệt thì câu hỏi mới được đưa vào đề bài tập.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAutoGenerateQuestions}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {isSubmitting
                    ? autoGenTier === 'paid_pro'
                      ? 'Đang gọi Gemini AI tạo câu hỏi...'
                      : 'Đang tạo câu hỏi...'
                    : `Xác nhận tạo ${totalShortage} câu hỏi`}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: THÔNG BÁO TẠO THÀNH CÔNG ================= */}
      {autoGenSuccessModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setAutoGenSuccessModalOpen(false)}
          title="Đã tạo câu hỏi tự động thành công!"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-emerald-950 text-sm">
                  Đã tạo thành công {autoGenCountGenerated} câu hỏi ở trạng thái CHƯA DUYỆT!
                </p>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Các câu hỏi mới đã được lưu vào hệ thống và gắn chia đều vào các chủ đề đã chọn.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setAutoGenSuccessModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
              >
                Ở lại trang tạo bài tập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoGenSuccessModalOpen(false);
                  navigate('/teacher/question-bank?tab=pending_review');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Ngân hàng câu hỏi để duyệt ngay</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
