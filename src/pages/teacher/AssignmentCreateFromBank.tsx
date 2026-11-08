import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { LessonTopic, Question, Assignment, AssignmentQuestionItem, QuestionDifficulty } from '../../types';
import { MathRenderer } from '../../components/common/MathRenderer';
import { Modal } from '../../components/common/Modal';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Send,
  Save,
  Check,
  X,
  FileText,
  Sliders,
  Settings,
  ListOrdered,
  Shuffle,
  ShieldAlert,
  ChevronDown,
  Layers,
  Award,
  Users
} from 'lucide-react';

export const AssignmentCreateFromBank: React.FC = () => {
  const navigate = useNavigate();
  const { classes, selectedClassId } = useClass();
  const { user, role } = useAuth();

  // 5 Steps workflow:
  // Step 1: Thông tin cơ bản & Chọn chủ đề (Mục 4.1)
  // Step 2: Dạng bài & Logic chọn số câu phụ thuộc (Mục 4.2)
  // Step 3: Xem & Thay đổi câu hỏi đã chọn (Mục 5)
  // Step 4: Điểm số, thời gian, quy chế & chính sách (Mục 4.3)
  // Step 5: Xem trước đề & Giao bài / Lưu nháp (Mục 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Data sources
  const [allTopics, setAllTopics] = useState<LessonTopic[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Basic Information (Matching screenshot layout)
  const [asgType, setAsgType] = useState<'homework' | 'exam' | 'classwork'>('homework');
  const [title, setTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(['cls-ltai']);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classId = selectedClassIds[0] || 'cls-ltai';
  const [subjectId, setSubjectId] = useState('sub-math');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 16);
  });
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['top-gemini']);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Selected classes memo & student count
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
      } else {
        return [...prev, cId];
      }
    });
  };

  // Step 2: Format & Question Counts
  const [formatType, setFormatType] = useState<'both' | 'mcq_only' | 'essay_only'>('both');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuestionDifficulty>('all');
  const [selectionMode, setSelectionMode] = useState<'random' | 'manual'>('random');
  const [selectedMcqCount, setSelectedMcqCount] = useState<number>(5);
  const [selectedEssayCount, setSelectedEssayCount] = useState<number>(2);
  const [step2Warning, setStep2Warning] = useState<string | null>(null);

  // Step 3: Selected Questions Roster
  const [selectedQuestions, setSelectedQuestions] = useState<Array<Question & { pointsAllocated?: number }>>([]);
  const [manualSelectedQIds, setManualSelectedQIds] = useState<string[]>([]);

  // Step 4: Points & Policies
  const [pointsMax, setPointsMax] = useState<number>(10);
  const [pointsDistribution, setPointsDistribution] = useState<'auto_even' | 'custom'>('auto_even');
  const [customPointsMap, setCustomPointsMap] = useState<Record<string, number>>({});
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [allowLate, setAllowLate] = useState<boolean>(true);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [showAnswersMode, setShowAnswersMode] = useState<'after_submit' | 'after_due_date' | 'manual'>('after_submit');

  // Step 5: Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load topics & questions
  const loadData = async () => {
    setLoading(true);
    const [tList, qList] = await Promise.all([
      DataService.getLessonTopics(),
      DataService.getQuestions()
    ]);
    setAllTopics(tList);
    setAllQuestions(qList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

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

  const recentTopic = availableTopics[0];
  const previousTopics = availableTopics.slice(1);

  // Tính số câu hỏi đủ điều kiện thời gian thực từ các chủ đề đã chọn (Mục 4.2)
  const eligibleData = useMemo(() => {
    return DataService.getEligibleQuestionsForTopics(selectedTopicIds, {
      difficulty: difficultyFilter,
      formatType
    });
  }, [selectedTopicIds, difficultyFilter, formatType, allTopics, allQuestions]);

  const maxAvailableMcq = eligibleData.mcqEligible.length;
  const maxAvailableEssay = eligibleData.essayEligible.length;

  // Tự động kiểm tra & cập nhật logic phụ thuộc số câu khi đổi lớp/môn/chủ đề/dạng bài/độ khó (Mục 4.2)
  useEffect(() => {
    let warning: string | null = null;

    if (selectedTopicIds.length === 0) {
      return;
    }

    // Kiểm tra MCQ
    if (formatType === 'both' || formatType === 'mcq_only') {
      if (maxAvailableMcq === 0) {
        warning = 'Cảnh báo: Các chủ đề đã chọn chưa có câu hỏi trắc nghiệm đủ điều kiện.';
        setSelectedMcqCount(0);
      } else if (selectedMcqCount > maxAvailableMcq) {
        warning = `Số câu trắc nghiệm đã chọn (${selectedMcqCount}) vượt quá nguồn khả dụng (${maxAvailableMcq}). Đã đặt lại về ${maxAvailableMcq} câu.`;
        setSelectedMcqCount(maxAvailableMcq);
      } else if (selectedMcqCount === 0 && maxAvailableMcq > 0) {
        setSelectedMcqCount(Math.min(5, maxAvailableMcq));
      }
    }

    // Kiểm tra Essay
    if (formatType === 'both' || formatType === 'essay_only') {
      if (maxAvailableEssay === 0) {
        const essayMsg = 'Cảnh báo: Các chủ đề đã chọn chưa có câu hỏi tự luận đủ điều kiện.';
        warning = warning ? `${warning} ${essayMsg}` : essayMsg;
        setSelectedEssayCount(0);
      } else if (selectedEssayCount > maxAvailableEssay) {
        warning = `Số câu tự luận đã chọn (${selectedEssayCount}) vượt quá nguồn khả dụng (${maxAvailableEssay}). Đã đặt lại về ${maxAvailableEssay} câu.`;
        setSelectedEssayCount(maxAvailableEssay);
      } else if (selectedEssayCount === 0 && maxAvailableEssay > 0) {
        setSelectedEssayCount(Math.min(2, maxAvailableEssay));
      }
    }

    setStep2Warning(warning);
  }, [selectedTopicIds, formatType, difficultyFilter, maxAvailableMcq, maxAvailableEssay]);

  // Khi chuyển từ Step 2 sang Step 3: Chọn câu hỏi tự động ngẫu nhiên hoặc áp dụng thủ công (Mục 5)
  const prepareQuestionsForStep3 = () => {
    let mcqPool = [...eligibleData.mcqEligible];
    let essayPool = [...eligibleData.essayEligible];

    // Trộn ngẫu nhiên
    mcqPool.sort(() => Math.random() - 0.5);
    essayPool.sort(() => Math.random() - 0.5);

    let chosenMCQ: Question[] = [];
    let chosenEssay: Question[] = [];

    if (formatType === 'both' || formatType === 'mcq_only') {
      const takeMcq = Math.min(selectedMcqCount, mcqPool.length);
      chosenMCQ = mcqPool.slice(0, takeMcq);
    }

    if (formatType === 'both' || formatType === 'essay_only') {
      const takeEssay = Math.min(selectedEssayCount, essayPool.length);
      chosenEssay = essayPool.slice(0, takeEssay);
    }

    const combined = [...chosenMCQ, ...chosenEssay];
    setSelectedQuestions(combined);
    setManualSelectedQIds(combined.map((q) => q.id));

    // Khởi tạo điểm tự động chia đều
    if (combined.length > 0) {
      const pointPerQuestion = Math.round((pointsMax / combined.length) * 10) / 10;
      const initialMap: Record<string, number> = {};
      combined.forEach((q) => {
        initialMap[q.id] = pointPerQuestion;
      });
      setCustomPointsMap(initialMap);
    }
  };

  // Đổi 1 câu hỏi khác ngẫu nhiên (Swap question) mà không làm mất cấu hình (Mục 5)
  const handleSwapQuestion = (targetQId: string) => {
    const targetQ = selectedQuestions.find((q) => q.id === targetQId);
    if (!targetQ) return;

    const isEssay = targetQ.question_type === 'essay' || targetQ.question_type === 'short_answer';
    const currentSelectedIds = new Set(selectedQuestions.map((q) => q.id));

    // Tìm trong pool đủ điều kiện các câu chưa được chọn
    const candidatePool = (isEssay ? eligibleData.essayEligible : eligibleData.mcqEligible).filter(
      (q) => !currentSelectedIds.has(q.id)
    );

    if (candidatePool.length === 0) {
      showToast('error', 'Không còn câu hỏi thay thế nào khác trong các chủ đề đã chọn.');
      return;
    }

    // Chọn ngẫu nhiên 1 câu thay thế
    const replacement = candidatePool[Math.floor(Math.random() * candidatePool.length)];

    setSelectedQuestions((prev) =>
      prev.map((q) => (q.id === targetQId ? replacement : q))
    );

    setCustomPointsMap((prev) => {
      const next = { ...prev };
      next[replacement.id] = next[targetQId] || 1;
      delete next[targetQId];
      return next;
    });

    showToast('success', `Đã đổi câu ${targetQ.code || targetQ.id} sang ${replacement.code || replacement.id}.`);
  };

  // Tính tổng điểm hiện tại
  const totalCustomPoints = useMemo(() => {
    if (pointsDistribution === 'auto_even') return pointsMax;
    return Object.values(customPointsMap).reduce((sum, p) => sum + (Number(p) || 0), 0);
  }, [pointsDistribution, customPointsMap, pointsMax]);

  // Handle Submit / Giao bài hoặc Lưu nháp (Mục 5 & 6)
  const handleFinalSubmit = async (status: 'published' | 'draft') => {
    if (selectedQuestions.length === 0) {
      showToast('error', 'Đề bài chưa có câu hỏi nào. Vui lòng kiểm tra lại cấu hình.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cls = classes.find((c) => c.id === classId);
      const subjName =
        subjectId === 'sub-math'
          ? 'Toán Học'
          : subjectId === 'sub-lit'
          ? 'Ngữ Văn'
          : subjectId === 'sub-eng'
          ? 'Tiếng Anh'
          : 'Vật Lý';

      // Chuyển đổi sang AssignmentQuestionItem lưu snapshot đề
      const questionItems: AssignmentQuestionItem[] = selectedQuestions.map((q) => {
        const point =
          pointsDistribution === 'auto_even'
            ? Math.round((pointsMax / selectedQuestions.length) * 10) / 10
            : customPointsMap[q.id] || 1;

        return {
          id: q.id,
          question_text: q.question_text,
          type:
            q.question_type === 'essay' || q.question_type === 'short_answer'
              ? 'essay'
              : 'multiple_choice',
          options: q.options?.map((opt) => `${opt.id}. ${opt.text}`),
          correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : 'A',
          explanation: q.explanation,
          points: point
        };
      });

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
          description: specialInstructions || 'Hoàn thành các câu hỏi trong đề và nộp bài trước hạn.',
          type: asgType === 'classwork' ? 'homework' : asgType,
          topic_ids: selectedTopicIds,
          question_selection_mode: selectionMode,
          format_type: formatType,
          mcq_count: selectedMcqCount,
          essay_count: selectedEssayCount,
          difficulty_filter: difficultyFilter,
          duration_minutes: asgType === 'exam' ? durationMinutes : 0,
          max_attempts: maxAttempts,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
          show_answers_mode: showAnswersMode,
          special_instructions: specialInstructions,
          due_date: new Date(dueDate).toISOString(),
          points_max: pointsMax,
          status: status,
          allow_late: allowLate,
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
      }, 1500);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi giao bài tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 Validation
  const canProceedStep1 = title.trim() && selectedTopicIds.length > 0;

  // Step 2 Validation (Mục 4.2: Khóa tạo đề nếu thiếu câu)
  const isLackingQuestions =
    (formatType === 'mcq_only' && (maxAvailableMcq === 0 || selectedMcqCount === 0)) ||
    (formatType === 'essay_only' && (maxAvailableEssay === 0 || selectedEssayCount === 0)) ||
    (formatType === 'both' && (maxAvailableMcq === 0 || maxAvailableEssay === 0 || selectedMcqCount === 0 || selectedEssayCount === 0));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Breadcrumb Navigation matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/80 p-3.5 sm:px-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap text-slate-500">
          <button
            onClick={() => navigate('/teacher/overview')}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Dạy &amp; Học</span>
          </button>
          <span className="text-slate-400">&gt;</span>
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
          >
            Giao bài tập
          </button>
          <span className="text-slate-400">&gt;</span>
          <span className="font-bold text-slate-800">
            Tạo bài tập từ NHCH • Tạo bài tập &amp; Kiểm tra từ Ngân hàng câu hỏi
          </span>
        </div>

        <button
          onClick={() => navigate('/teacher/assignments')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>

      {/* STEP PROGRESS INDICATOR (5 BƯỚC) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-3 sm:p-4">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: 'Thông tin & Chủ đề' },
            { num: 2, label: 'Dạng bài & Số câu' },
            { num: 3, label: 'Chọn & Thay câu' },
            { num: 4, label: 'Điểm & Quy chế' },
            { num: 5, label: 'Xem trước & Giao' }
          ].map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`py-2 px-1 sm:px-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-400 font-semibold'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isCurrent
                      ? 'bg-white text-blue-600'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span className="text-[11px] sm:text-xs truncate max-w-full">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= BƯỚC 1: THÔNG TIN CƠ BẢN & CHỌN CHỦ ĐỀ (WHITE BACKGROUND) ================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          {/* HÀNG 1: Loại bài tập, Lớp nhận bài, Môn học */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start text-xs">
            {/* Cột 1: Loại bài tập * */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                Loại bài tập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={asgType}
                  onChange={(e) => setAsgType(e.target.value as any)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all pr-9"
                >
                  <option value="homework">Bài tập về nhà (Homework)</option>
                  <option value="exam">Bài kiểm tra (Exam)</option>
                  <option value="classwork">Luyện tập trên lớp (Classwork)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Cột 2: Lớp nhận bài * (Chọn nhiều lớp) */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Lớp nhận bài <span className="text-rose-500">*</span>{' '}
                  <span className="text-[11px] text-cyan-600 font-semibold">(Chọn nhiều lớp)</span>
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedClassIds.length}/{classes.length || 7} Lớp
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="w-full text-left px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {selectedClasses.length === 1
                        ? selectedClasses[0].name
                        : `${selectedClasses.length} lớp đã chọn (${selectedClasses.map((c) => c.name).join(', ')})`}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Class Multi-select Dropdown Popover */}
                {isClassDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsClassDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-2.5 max-h-60 overflow-y-auto space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
                        <span>Chọn các lớp nhận bài tập</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedClassIds.length === classes.length) {
                              setSelectedClassIds([classes[0]?.id || 'cls-ltai']);
                            } else {
                              setSelectedClassIds(classes.map((c) => c.id));
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 capitalize font-bold text-[10px]"
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
                            className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isChecked
                                ? 'bg-blue-50/80 text-blue-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>{cls.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {cls.student_count || 0} HS
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Selected Classes Preview Pill Tags below dropdown */}
              <div className="pt-1.5 text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  <span>Lớp được phân phối ({selectedClassIds.length} lớp - {totalStudents} HS):</span>
                </span>
                {selectedClasses.map((cls) => (
                  <span
                    key={cls.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-[11px]"
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
            </div>

            {/* Cột 3: Môn học * */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">
                Môn học <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden cursor-pointer transition-all pr-9"
                >
                  <option value="sub-math">Toán học</option>
                  <option value="sub-lit">Ngữ Văn</option>
                  <option value="sub-eng">Tiếng Anh</option>
                  <option value="sub-phys">Vật Lý</option>
                  <option value="sub-chem">Hóa học</option>
                  <option value="sub-info">Tin học</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* HÀNG 2: Tiêu đề bài tập / Kiểm tra * */}
          <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-slate-700">
              Tiêu đề bài tập / Kiểm tra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kiểm tra 15 phút - Hệ phương trình bậc nhất..."
              className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal text-sm"
              required
            />
          </div>

          {/* HÀNG 3: Chủ đề bài học liên kết (Màn hình 111) */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-blue-600 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Chủ đề bài học liên kết (Màn hình 111)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Đã chọn <b className="text-blue-600">{selectedTopicIds.length}</b> chủ đề
              </span>
            </div>

            {availableTopics.length > 0 ? (
              <div className="space-y-2.5">
                {availableTopics.map((topic) => {
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setSelectedTopicIds((prev) =>
                          prev.includes(topic.id)
                            ? prev.filter((id) => id !== topic.id)
                            : [...prev, topic.id]
                        );
                      }}
                      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50/40 border-cyan-500 text-slate-900 shadow-2xs ring-1 ring-cyan-500/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 shrink-0 cursor-pointer"
                        />
                        <span className="font-bold text-xs sm:text-sm truncate text-slate-800">
                          {topic.title}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-medium shrink-0 ml-4">
                        <span>Buổi: {new Date(topic.session_date).toISOString().slice(0, 10)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <span className="font-bold text-slate-800 block">
                  Chưa tìm thấy chủ đề nào phù hợp cho môn này
                </span>
                <p className="text-xs text-slate-500">
                  Bạn có thể tạo thêm chủ đề mới từ Màn hình 111.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/assignments/topics')}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Đến Quản lý chủ đề (Màn hình 111)
                </button>
              </div>
            )}
          </div>

          {/* HÀNG 4: Thời hạn nộp bài & Chỉ dẫn thêm */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Thời hạn nộp bài <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5">
                Yêu cầu thêm / Chỉ dẫn cho học sinh (không bắt buộc)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Ví dụ: Đọc kỹ đề bài, kiểm tra cẩn thận trước khi nộp..."
                className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/teacher/assignments')}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={!canProceedStep1}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>Tiếp tục: Cấu hình số câu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BƯỚC 2: DẠNG BÀI & LOGIC CHỌN SỐ CÂU PHỤ THUỘC ================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Bước 2 / Cấu hình dạng bài & Số lượng câu hỏi
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Thiết lập Dạng đề và Giới hạn câu hỏi theo Ngân hàng
            </h2>
          </div>

          {/* Cảnh báo thiếu câu hỏi (Mục 4.2) */}
          {step2Warning && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-bold">{step2Warning}</span>
              </div>
              <div className="flex items-center gap-3 pl-6">
                <button
                  type="button"
                  onClick={() => navigate('/teacher/assignments/topics')}
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Bổ sung câu hỏi vào chủ đề (Màn hình 111)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Dạng bài (Mục 4.1: 3 dạng) */}
          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-900 text-sm block">
              1. Chọn dạng bài <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'both', title: 'Trắc nghiệm & Tự luận', desc: 'Kết hợp cả câu hỏi trắc nghiệm và câu hỏi tự luận' },
                { id: 'mcq_only', title: 'Chỉ Trắc nghiệm', desc: 'Toàn bộ bài tập là các câu hỏi trắc nghiệm khách quan' },
                { id: 'essay_only', title: 'Chỉ Tự luận', desc: 'Đề bài gồm các câu hỏi tự luận hoặc giải thích chi tiết' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormatType(opt.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formatType === opt.id
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900 text-xs sm:text-sm">{opt.title}</span>
                    {formatType === opt.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* LOGIC CHỌN SỐ CÂU PHỤ THUỘC (MỤC 4.2: 1-20 MCQ, 1-10 Essay, không vượt quá nguồn khả dụng) */}
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/90 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                2. Số lượng câu hỏi cần lấy từ ngân hàng
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Nguồn khả dụng: <b className="text-emerald-700">{maxAvailableMcq} trắc nghiệm</b> •{' '}
                <b className="text-purple-700">{maxAvailableEssay} tự luận</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Combobox Trắc nghiệm (1-20) */}
              {(formatType === 'both' || formatType === 'mcq_only') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Số câu trắc nghiệm (Tối đa {Math.min(20, maxAvailableMcq)} câu khả dụng)
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Có {maxAvailableMcq} câu
                    </span>
                  </div>
                  <select
                    value={selectedMcqCount}
                    onChange={(e) => setSelectedMcqCount(Number(e.target.value))}
                    disabled={maxAvailableMcq === 0}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {maxAvailableMcq === 0 ? (
                      <option value={0}>Không có câu trắc nghiệm nào</option>
                    ) : (
                      Array.from({ length: Math.min(20, maxAvailableMcq) }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num} câu trắc nghiệm
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>
              )}

              {/* Combobox Tự luận (1-10) */}
              {(formatType === 'both' || formatType === 'essay_only') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Số câu tự luận (Tối đa {Math.min(10, maxAvailableEssay)} câu khả dụng)
                    </label>
                    <span className="text-[11px] font-bold text-purple-700">
                      Có {maxAvailableEssay} câu
                    </span>
                  </div>
                  <select
                    value={selectedEssayCount}
                    onChange={(e) => setSelectedEssayCount(Number(e.target.value))}
                    disabled={maxAvailableEssay === 0}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {maxAvailableEssay === 0 ? (
                      <option value={0}>Không có câu tự luận nào</option>
                    ) : (
                      Array.from({ length: Math.min(10, maxAvailableEssay) }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num} câu tự luận
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Độ khó & Chế độ chọn câu (Mục 4.3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Lọc theo độ khó câu hỏi
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value="all">Tất cả các độ khó (Nhận biết, Thông hiểu, Vận dụng)</option>
                <option value="nhan_biet">Nhận biết (Dễ)</option>
                <option value="thong_hieu">Thông hiểu (Trung bình)</option>
                <option value="van_dung">Vận dụng (Khó)</option>
                <option value="van_dung_cao">Vận dụng cao</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Chế độ lấy câu hỏi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionMode('random')}
                  className={`p-2.5 rounded-xl font-bold border transition-all ${
                    selectionMode === 'random'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Tự động ngẫu nhiên
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('manual')}
                  className={`p-2.5 rounded-xl font-bold border transition-all ${
                    selectionMode === 'manual'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Chọn thủ công
                </button>
              </div>
            </div>
          </div>

          {/* Actions Step 2 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <button
              type="button"
              disabled={isLackingQuestions}
              onClick={() => {
                prepareQuestionsForStep3();
                setCurrentStep(3);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <span>Tiếp tục: Xem danh sách câu ({selectedMcqCount + selectedEssayCount} câu)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BƯỚC 3: XEM & THAY ĐỔI CÂU HỎI ĐÃ CHỌN ================= */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Bước 3 / Danh sách câu hỏi trong đề
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Xem chi tiết câu hỏi & Thay câu linh hoạt
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bạn có thể bấm nút "Đổi câu khác" để hệ thống lấy câu tương đương từ ngân hàng mà không làm mất cấu hình.
              </p>
            </div>

            <button
              type="button"
              onClick={prepareQuestionsForStep3}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Trộn lại toàn bộ đề</span>
            </button>
          </div>

          <div className="space-y-4">
            {selectedQuestions.map((q, idx) => {
              const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';

              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 bg-slate-50/80 rounded-3xl border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[11px]">
                        {q.code || q.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                          isEssay ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Độ khó: {q.difficulty}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSwapQuestion(q.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span>Đổi câu khác</span>
                    </button>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pl-1">
                    <MathRenderer content={q.question_text} />
                  </div>

                  {/* Options đối với trắc nghiệm */}
                  {!isEssay && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            q.correct_answer === opt.id || (Array.isArray(q.correct_answer) && q.correct_answer.includes(opt.id))
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lời giải thích */}
                  {q.explanation && (
                    <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 pl-3">
                      <span className="font-bold text-slate-700">Lời giải chi tiết: </span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Tiếp tục: Thiết lập Điểm & Quy chế</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BƯỚC 4: THIẾT LẬP ĐIỂM SỐ, THỜI GIAN & QUY CHẾ ================= */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Bước 4 / Thiết lập thang điểm & Quy chế thi
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Cấu hình Điểm số, Thời gian làm bài và Chính sách hiển thị đáp án
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Thang điểm tối đa */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Thang điểm tối đa của đề <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={pointsMax}
                onChange={(e) => setPointsMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Thời gian làm bài */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Thời gian làm bài (phút)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value={0}>Không giới hạn thời gian (Thích hợp BTVN)</option>
                <option value={15}>15 phút</option>
                <option value={45}>45 phút (1 tiết)</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút (2 tiết)</option>
              </select>
            </div>

            {/* Số lần làm bài */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Số lần làm bài tối đa
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value={1}>1 lần duy nhất</option>
                <option value={2}>2 lần (Lấy điểm cao nhất)</option>
                <option value={99}>Không giới hạn số lần làm</option>
              </select>
            </div>
          </div>

          {/* Phân bổ điểm số */}
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/90 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Phân bổ điểm cho từng câu hỏi</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPointsDistribution('auto_even')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                    pointsDistribution === 'auto_even'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Tự động chia đều ({Math.round((pointsMax / selectedQuestions.length) * 10) / 10}đ/câu)
                </button>
                <button
                  type="button"
                  onClick={() => setPointsDistribution('custom')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                    pointsDistribution === 'custom'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Tùy chỉnh từng câu
                </button>
              </div>
            </div>

            {pointsDistribution === 'custom' && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedQuestions.map((q, qIdx) => (
                    <div key={q.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Câu {qIdx + 1}:</span>
                      <input
                        type="number"
                        step="0.25"
                        min={0.25}
                        max={10}
                        value={customPointsMap[q.id] || 1}
                        onChange={(e) =>
                          setCustomPointsMap({
                            ...customPointsMap,
                            [q.id]: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-blue-700 text-right"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end text-xs font-bold pt-1">
                  <span>Tổng điểm hiện tại: </span>
                  <span className={`ml-1 ${totalCustomPoints === pointsMax ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {totalCustomPoints} / {pointsMax} điểm {totalCustomPoints !== pointsMax && '(chưa khớp)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tùy chọn nâng cao (Mục 4.3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <span className="font-bold text-slate-900 block">Quy tắc nộp bài & Trộn đề</span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Cho phép nộp muộn sau thời hạn</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Trộn ngẫu nhiên thứ tự câu hỏi khi học sinh làm</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Trộn ngẫu nhiên thứ tự đáp án (A, B, C, D)</span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <span className="font-bold text-slate-900 block">Thời điểm hiển thị đáp án & nhận xét</span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="showAnswersModeRadio"
                  value="after_submit"
                  checked={showAnswersMode === 'after_submit'}
                  onChange={() => setShowAnswersMode('after_submit')}
                />
                <span className="font-semibold text-slate-700">Ngay sau khi học sinh nộp bài</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="showAnswersModeRadio"
                  value="after_due_date"
                  checked={showAnswersMode === 'after_due_date'}
                  onChange={() => setShowAnswersMode('after_due_date')}
                />
                <span className="font-semibold text-slate-700">Sau khi hết thời hạn nộp bài</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="showAnswersModeRadio"
                  value="manual"
                  checked={showAnswersMode === 'manual'}
                  onChange={() => setShowAnswersMode('manual')}
                />
                <span className="font-semibold text-slate-700">Chỉ hiển thị khi giáo viên công bố</span>
              </label>
            </div>
          </div>

          {/* Actions Step 4 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Xem trước đề thi hoàn chỉnh</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BƯỚC 5: XEM TRƯỚC ĐỀ THI & GIAO BÀI (MỤC 5) ================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Bước 5 / Xem trước đề thi như học sinh sẽ thấy
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Kiểm tra toàn bộ cấu hình trước khi phát hành
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFinalSubmit('draft')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-all"
                >
                  Lưu bản nháp
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Giao bài tập ngay</span>
                </button>
              </div>
            </div>

            {/* Preview Header Card */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold">
                    {classes.find((c) => c.id === classId)?.name || 'Lớp 10A1'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/10 rounded-lg text-xs font-medium">
                    {subjectId === 'sub-math' ? 'Toán Học' : 'Ngữ Văn'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 rounded-lg text-xs font-bold">
                    {asgType === 'exam' ? 'Bài kiểm tra' : 'Bài tập về nhà'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-white">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Hạn nộp: {new Date(dueDate).toLocaleString('vi-VN')}
                  </span>
                  {durationMinutes > 0 && (
                    <span>Thời gian: {durationMinutes} phút</span>
                  )}
                  <span className="font-extrabold text-amber-400">
                    Thang điểm: {pointsMax}đ ({selectedQuestions.length} câu)
                  </span>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black">{title}</h1>

              {specialInstructions && (
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
                  {specialInstructions}
                </p>
              )}
            </div>

            {/* Questions Preview */}
            <div className="space-y-5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Nội dung đề bài ({selectedQuestions.length} câu hỏi)</span>
              </h3>

              {selectedQuestions.map((q, idx) => {
                const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';
                const point =
                  pointsDistribution === 'auto_even'
                    ? Math.round((pointsMax / selectedQuestions.length) * 10) / 10
                    : customPointsMap[q.id] || 1;

                return (
                  <div key={q.id} className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          Câu {idx + 1} ({point} điểm)
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          [{isEssay ? 'Tự luận' : 'Trắc nghiệm'}]
                        </span>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                      <MathRenderer content={q.question_text} />
                    </div>

                    {!isEssay && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2 font-medium"
                          >
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px]">
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEssay && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs italic">
                        [Khu vực học sinh làm bài tự luận / nhập lời giải hoặc tải file]
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 5 Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Xác nhận giao bài cho lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN GIAO BÀI (MỤC 5: Modal xác nhận lớp, sĩ số, hạn nộp) ================= */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Xác nhận phát hành bài tập cho lớp"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên bài:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp nhận bài:</span>
                <span className="font-extrabold text-blue-700">
                  {classes.find((c) => c.id === classId)?.name || '10A1'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng học sinh nhận đề:</span>
                <span className="font-bold text-slate-800">
                  {classes.find((c) => c.id === classId)?.student_count || 8} học sinh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hạn nộp bài:</span>
                <span className="font-bold text-rose-600">
                  {new Date(dueDate).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số câu hỏi:</span>
                <span className="font-bold text-slate-800">
                  {selectedQuestions.length} câu ({pointsMax} điểm)
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Hệ thống sẽ ngay lập tức gửi bài tập này đến bảng nhiệm vụ của toàn bộ học sinh trong lớp. Bạn có chắc chắn muốn phát hành?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
    </div>
  );
};
