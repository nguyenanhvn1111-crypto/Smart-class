import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonTopic, Question, QuestionDifficulty } from '../../types';
import { DataService } from '../../services/dataService';
import { MathRenderer } from '../common/MathRenderer';
import { BookQuestionIcon } from '../common/BookQuestionIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  HelpCircle,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Filter,
  Search,
  ArrowRight,
  ExternalLink,
  Award,
  Layers,
  Check,
  Eye,
  FileQuestion,
  AlertCircle
} from 'lucide-react';

interface TopicQuestionsModalProps {
  topic: LessonTopic;
  allQuestions: Question[];
  onClose: () => void;
  onTopicUpdated: (updatedTopic: LessonTopic) => void;
}

export const TopicQuestionsModal: React.FC<TopicQuestionsModalProps> = ({
  topic,
  allQuestions,
  onClose,
  onTopicUpdated
}) => {
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'current' | 'bank' | 'create'>('current');

  // Search & Filter in Bank tab
  const [bankSearch, setBankSearch] = useState('');
  const [bankDifficulty, setBankDifficulty] = useState<string>('all');
  const [bankType, setBankType] = useState<string>('all');
  const [selectedBankQIds, setSelectedBankQIds] = useState<string[]>([]);

  // Expanded question details
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  // Quick Question Creator State
  const [newQType, setNewQType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [newQDifficulty, setNewQDifficulty] = useState<QuestionDifficulty>('thong_hieu');
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQCorrectAns, setNewQCorrectAns] = useState('A');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRemoveQuestionId, setPendingRemoveQuestionId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setErrorMessage(null);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Current questions linked to this topic
  const linkedQuestions = useMemo(() => {
    return allQuestions.filter((q) => topic.question_ids?.includes(q.id));
  }, [allQuestions, topic.question_ids]);

  // Counts
  const mcqCount = linkedQuestions.filter(
    (q) => q.question_type !== 'essay' && q.question_type !== 'short_answer'
  ).length;
  const essayCount = linkedQuestions.length - mcqCount;

  // Questions in the bank not yet linked
  const unlinkedBankQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (topic.question_ids?.includes(q.id)) return false;

      // Filter by subject if matching
      const subjectMatch =
        !topic.subject_id ||
        topic.subject_id === 'all' ||
        q.subject_id === topic.subject_id ||
        (topic.subject_id === 'sub-math' && (q.subject_name?.includes('Toán') || q.subject_id === 'sub-math'));

      if (!subjectMatch) return false;

      // Search
      if (bankSearch.trim()) {
        const query = bankSearch.toLowerCase();
        const textMatch = q.question_text?.toLowerCase().includes(query);
        const codeMatch = q.code?.toLowerCase().includes(query);
        if (!textMatch && !codeMatch) return false;
      }

      // Difficulty
      if (bankDifficulty !== 'all' && q.difficulty !== bankDifficulty) {
        return false;
      }

      // Type
      if (bankType === 'mcq' && (q.question_type === 'essay' || q.question_type === 'short_answer')) {
        return false;
      }
      if (bankType === 'essay' && q.question_type !== 'essay' && q.question_type !== 'short_answer') {
        return false;
      }

      return true;
    });
  }, [allQuestions, topic, bankSearch, bankDifficulty, bankType]);

  // Remove question from topic
  const handleRemoveQuestion = (qId: string) => {
    setPendingRemoveQuestionId(qId);
  };

  const confirmRemoveQuestion = async () => {
    if (!pendingRemoveQuestionId) return;
    try {
      const updatedIds = (topic.question_ids || []).filter((id) => id !== pendingRemoveQuestionId);
      const updated = await DataService.updateLessonTopic(topic.id, {
        question_ids: updatedIds
      });
      onTopicUpdated(updated);
      showToast('Đã gỡ câu hỏi khỏi chủ đề bài học.');
    } catch (err: any) {
      showError('Không thể cập nhật: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setPendingRemoveQuestionId(null);
    }
  };

  // Add selected questions from bank to topic
  const handleAddSelectedBankQuestions = async () => {
    if (selectedBankQIds.length === 0) return;

    try {
      setIsSaving(true);
      const newIds = Array.from(new Set([...(topic.question_ids || []), ...selectedBankQIds]));
      const updated = await DataService.updateLessonTopic(topic.id, {
        question_ids: newIds
      });
      onTopicUpdated(updated);
      setSelectedBankQIds([]);
      setActiveTab('current');
      showToast(`Đã thêm thành công ${selectedBankQIds.length} câu hỏi vào chủ đề!`);
    } catch (err: any) {
      showError('Lỗi: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Create Question for this topic
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) {
      showError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    setIsSaving(true);
    try {
      const options =
        newQType === 'multiple_choice'
          ? [
              { id: 'A', text: newQOptA || 'Phương án A', is_correct: newQCorrectAns === 'A' },
              { id: 'B', text: newQOptB || 'Phương án B', is_correct: newQCorrectAns === 'B' },
              { id: 'C', text: newQOptC || 'Phương án C', is_correct: newQCorrectAns === 'C' },
              { id: 'D', text: newQOptD || 'Phương án D', is_correct: newQCorrectAns === 'D' }
            ]
          : [];

      const createdQ = await DataService.createQuestion({
        question_text: newQText.trim(),
        question_type: newQType,
        difficulty: newQDifficulty,
        subject_id: topic.subject_id || 'sub-math',
        subject_name: topic.subject_name || 'Toán Học',
        teacher_id: topic.created_by || 'user-teacher-1',
        teacher_name: topic.created_by_name || 'Cô Trần Thị Mai',
        points: 1,
        options,
        correct_answer: newQType === 'multiple_choice' ? newQCorrectAns : 'Xem hướng dẫn chấm',
        explanation: newQExplanation.trim() || undefined,
        topic_name: topic.title,
        tags: [topic.title, topic.class_name]
      });

      // Attach new question to topic
      const updatedIds = [...(topic.question_ids || []), createdQ.id];
      const updated = await DataService.updateLessonTopic(topic.id, {
        question_ids: updatedIds
      });
      onTopicUpdated(updated);

      // Reset form
      setNewQText('');
      setNewQOptA('');
      setNewQOptB('');
      setNewQOptC('');
      setNewQOptD('');
      setNewQExplanation('');
      setActiveTab('current');
      showToast(`Đã tạo mới và gắn câu hỏi vào chủ đề thành công!`);
    } catch (err: any) {
      showError('Lỗi tạo câu hỏi: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <header className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <BookQuestionIcon className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {topic.class_name} • {topic.subject_name}
                </span>
                <span className="text-[11px] text-slate-400">
                  Buổi {topic.period_number || 1} • {new Date(topic.session_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate max-w-xl">
                Quản lý câu hỏi: {topic.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/assignments/create-from-bank')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Giao bài tập</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs & Counters */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Câu hỏi trong chủ đề</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-black">
                {linkedQuestions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bank'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm từ Ngân hàng</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Tạo câu hỏi mới</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              <span>Trắc nghiệm:</span>
              <b>{mcqCount} câu</b>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-bold">
              <span>Tự luận:</span>
              <b>{essayCount} câu</b>
            </span>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= TAB 1: DANH SÁCH CÂU HỎI HIỆN TẠI TRONG CHỦ ĐỀ ================= */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Tất cả câu hỏi đã liên kết với chủ đề ({linkedQuestions.length} câu)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các câu hỏi này sẽ được sử dụng khi giáo viên phát vấn tại lớp hoặc tạo đề kiểm tra/bài tập từ ngân hàng.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('bank')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>
              </div>

              {linkedQuestions.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl space-y-3">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-black text-slate-700">Chưa có câu hỏi nào trong chủ đề này</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Bạn có thể bấm "Thêm từ Ngân hàng" để gắn các câu hỏi có sẵn, hoặc "Tạo câu hỏi mới" để bổ sung ngay.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('bank')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Chọn từ Ngân hàng câu hỏi
                    </button>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Tạo câu hỏi mới
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedQuestions.map((q, idx) => {
                    const isExpanded = expandedQId === q.id;
                    const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';

                    return (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {q.code || q.id}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    isEssay
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                                </span>

                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {q.difficulty === 'nhan_biet'
                                    ? 'Nhận biết'
                                    : q.difficulty === 'van_dung'
                                    ? 'Vận dụng'
                                    : 'Thông hiểu'}
                                </span>

                                <span className="text-[11px] text-slate-400">
                                  Điểm: <b>{q.points || 1}đ</b>
                                </span>
                              </div>

                              <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                                <MathRenderer content={q.question_text} />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                            </button>

                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              title="Gỡ khỏi chủ đề"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Options for MCQ */}
                        {!isEssay && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            {q.options.map((opt) => {
                              const isCorrect =
                                opt.is_correct ||
                                opt.id === q.correct_answer ||
                                opt.text === q.correct_answer;

                              return (
                                <div
                                  key={opt.id}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-slate-50/60 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {opt.id}
                                  </span>
                                  <div className="truncate flex-1">
                                    <MathRenderer content={opt.text} />
                                  </div>
                                  {isCorrect && (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Expanded Explanation / Detail View */}
                        {isExpanded && (
                          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1.5 text-slate-800">
                            <span className="font-bold text-blue-900 block">
                              Đáp án đúng: <b>{typeof q.correct_answer === 'string' ? q.correct_answer : 'Đáp án mẫu'}</b>
                            </span>
                            {q.explanation && (
                              <div className="text-slate-600 leading-relaxed">
                                <span className="font-semibold text-slate-700">Lời giải chi tiết:</span>
                                <div className="mt-1">
                                  <MathRenderer content={q.explanation} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: THÊM CÂU HỎI TỪ NGÂN HÀNG ================= */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              {/* Filter Ribbon */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nội dung hoặc mã câu hỏi..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <select
                      value={bankDifficulty}
                      onChange={(e) => setBankDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="nhan_biet">Nhận biết</option>
                      <option value="thong_hieu">Thông hiểu</option>
                      <option value="van_dung">Vận dụng</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={bankType}
                      onChange={(e) => setBankType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700"
                    >
                      <option value="all">Tất cả dạng bài</option>
                      <option value="mcq">Chỉ Trắc nghiệm</option>
                      <option value="essay">Chỉ Tự luận</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>
                    Tìm thấy <b>{unlinkedBankQuestions.length}</b> câu hỏi khả dụng trong ngân hàng môn{' '}
                    <b>{topic.subject_name}</b>
                  </span>

                  {selectedBankQIds.length > 0 && (
                    <button
                      onClick={handleAddSelectedBankQuestions}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      + Gắn {selectedBankQIds.length} câu đã chọn vào chủ đề
                    </button>
                  )}
                </div>
              </div>

              {/* Questions List */}
              {unlinkedBankQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Không tìm thấy câu hỏi ngân hàng nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unlinkedBankQuestions.map((q) => {
                    const isChecked = selectedBankQIds.includes(q.id);
                    const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedBankQIds((prev) =>
                            prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                          );
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400/30'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 mt-1 cursor-pointer shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {q.code || q.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                isEssay
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                              {q.difficulty === 'nhan_biet'
                                ? 'Nhận biết'
                                : q.difficulty === 'van_dung'
                                ? 'Vận dụng'
                                : 'Thông hiểu'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {q.subject_name || 'Toán học'}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm font-medium text-slate-900">
                            <MathRenderer content={q.question_text} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: TẠO CÂU HỎI MỚI VÀ GẮN VÀO CHỦ ĐỀ ================= */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dạng câu hỏi</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="multiple_choice">Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                    <option value="essay">Tự luận / Tự trả lời</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={newQDifficulty}
                    onChange={(e) => setNewQDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="nhan_biet">Nhận biết</option>
                    <option value="thong_hieu">Thông hiểu</option>
                    <option value="van_dung">Vận dụng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung câu hỏi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Nhập nội dung đề bài (hỗ trợ công thức Toán dạng $x^2 + y = 0$)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                />
              </div>

              {newQType === 'multiple_choice' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">
                    4 Phương án trắc nghiệm & chọn đáp án đúng
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'A', val: newQOptA, set: setNewQOptA },
                      { key: 'B', val: newQOptB, set: setNewQOptB },
                      { key: 'C', val: newQOptC, set: setNewQOptC },
                      { key: 'D', val: newQOptD, set: setNewQOptD }
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          newQCorrectAns === opt.key
                            ? 'bg-emerald-50/80 border-emerald-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_opt"
                          checked={newQCorrectAns === opt.key}
                          onChange={() => setNewQCorrectAns(opt.key)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-bold text-xs">{opt.key}.</span>
                        <input
                          type="text"
                          required
                          value={opt.val}
                          onChange={(e) => opt.set(e.target.value)}
                          placeholder={`Phương án ${opt.key}...`}
                          className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lời giải chi tiết / Hướng dẫn giải (không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  placeholder="Nhập các bước giải, lưu ý sư phạm..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('current')}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu & Thêm ngay vào chủ đề'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>Chủ đề: <b>{topic.title}</b></span>
            <span>•</span>
            <span>Lớp: <b>{topic.class_name}</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/question-bank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Ngân hàng câu hỏi</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </footer>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingRemoveQuestionId)}
        onClose={() => setPendingRemoveQuestionId(null)}
        onConfirm={confirmRemoveQuestion}
        title="Gỡ câu hỏi khỏi chủ đề"
        message="Bạn có chắc chắn muốn bỏ câu hỏi này khỏi chủ đề bài học?"
        confirmLabel="Gỡ khỏi chủ đề"
        isDestructive={true}
      />
    </div>
  );
};
