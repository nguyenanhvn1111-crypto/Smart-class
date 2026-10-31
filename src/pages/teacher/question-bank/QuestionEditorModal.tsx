import React, { useState, useEffect } from 'react';
import { Question, QuestionType, QuestionDifficulty, QuestionStatus } from '../../../types';
import { MathRenderer } from '../../../components/common/MathRenderer';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
  Save,
  BookOpen
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: Partial<Question>) => Promise<void>;
  initialQuestion?: Question | null;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion
}) => {
  const isEditing = Boolean(initialQuestion);

  // General fields
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('thong_hieu');
  const [subjectName, setSubjectName] = useState('Toán Học');
  const [gradeName, setGradeName] = useState('Khối 10');
  const [chapterName, setChapterName] = useState('Chương 1: Kiến thức trọng tâm');
  const [lessonName, setLessonName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [points, setPoints] = useState(1.0);
  const [status, setStatus] = useState<QuestionStatus>('approved');

  // Question stem & explanation
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');

  // 1 & 2: Single & Multiple Choice options
  const [options, setOptions] = useState<{ id: string; text: string; is_correct?: boolean }[]>([
    { id: 'A', text: '', is_correct: true },
    { id: 'B', text: '', is_correct: false },
    { id: 'C', text: '', is_correct: false },
    { id: 'D', text: '', is_correct: false }
  ]);
  const [singleCorrectAnswer, setSingleCorrectAnswer] = useState('A');
  const [multipleCorrectAnswers, setMultipleCorrectAnswers] = useState<string[]>(['A']);

  // 3: True / False Statements
  const [statements, setStatements] = useState<{ id: string; text: string; is_correct: boolean }[]>([
    { id: 'st-1', text: '', is_correct: true },
    { id: 'st-2', text: '', is_correct: false },
    { id: 'st-3', text: '', is_correct: true },
    { id: 'st-4', text: '', is_correct: true }
  ]);

  // 4: Matching Pairs
  const [matchingPairs, setMatchingPairs] = useState<{ left_id: string; left_text: string; right_id: string; right_text: string }[]>([
    { left_id: 'A1', left_text: '', right_id: 'B1', right_text: '' },
    { left_id: 'A2', left_text: '', right_id: 'B2', right_text: '' },
    { left_id: 'A3', left_text: '', right_id: 'B3', right_text: '' }
  ]);

  // 5: Ordering Items
  const [orderingItems, setOrderingItems] = useState<{ id: string; text: string; correct_order: number }[]>([
    { id: 'ord-1', text: '', correct_order: 1 },
    { id: 'ord-2', text: '', correct_order: 2 },
    { id: 'ord-3', text: '', correct_order: 3 }
  ]);

  // 6: Fill Blanks
  const [blanks, setBlanks] = useState<{ id: string; label: string; accepted_answers: string[] }[]>([
    { id: 'blank1', label: 'Ô trống [blank1]', accepted_answers: [''] },
    { id: 'blank2', label: 'Ô trống [blank2]', accepted_answers: [''] }
  ]);

  // 7: Short Answer
  const [shortAnswerSample, setShortAnswerSample] = useState('');
  const [shortAnswerVariants, setShortAnswerVariants] = useState('');
  const [shortAnswerUnit, setShortAnswerUnit] = useState('');
  const [shortAnswerTolerance, setShortAnswerTolerance] = useState(0);

  // 8: Essay Rubric
  const [essayAnswer, setEssayAnswer] = useState('');
  const [rubricItems, setRubricItems] = useState<{ id: string; criteria: string; max_points: number; description: string }[]>([
    { id: 'rb-1', criteria: 'Đúng cấu trúc và yêu cầu đề bài', max_points: 0.5, description: 'Trình bày rõ ràng, không sai thể loại' },
    { id: 'rb-2', criteria: 'Nội dung lập luận và dẫn chứng', max_points: 1.0, description: 'Luận điểm thuyết phục, dẫn chứng cụ thể' },
    { id: 'rb-3', criteria: 'Sáng tạo và liên hệ thực tế', max_points: 0.5, description: 'Có góc nhìn cá nhân sâu sắc' }
  ]);

  // 9: Passage
  const [passageText, setPassageText] = useState('');

  // UI state
  const [showPreview, setShowPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset or fill form on open
  useEffect(() => {
    if (initialQuestion) {
      setQuestionType(initialQuestion.question_type || 'single_choice');
      setDifficulty(initialQuestion.difficulty || 'thong_hieu');
      setSubjectName(initialQuestion.subject_name || 'Toán Học');
      setGradeName(initialQuestion.grade_name || 'Khối 10');
      setChapterName(initialQuestion.chapter_name || '');
      setLessonName(initialQuestion.lesson_name || '');
      setTagsInput(initialQuestion.tags?.join(', ') || '');
      setPoints(initialQuestion.points || 1.0);
      setStatus(initialQuestion.status || 'approved');
      setQuestionText(initialQuestion.question_text || '');
      setExplanation(initialQuestion.explanation || '');

      if (initialQuestion.options && initialQuestion.options.length > 0) {
        setOptions(initialQuestion.options);
      }
      if (initialQuestion.question_type === 'single_choice') {
        setSingleCorrectAnswer(typeof initialQuestion.correct_answer === 'string' ? initialQuestion.correct_answer : 'A');
      } else if (initialQuestion.question_type === 'multiple_choice') {
        setMultipleCorrectAnswers(Array.isArray(initialQuestion.correct_answer) ? initialQuestion.correct_answer : ['A']);
      }
      if (initialQuestion.statements) setStatements(initialQuestion.statements);
      if (initialQuestion.matching_pairs) setMatchingPairs(initialQuestion.matching_pairs);
      if (initialQuestion.ordering_items) setOrderingItems(initialQuestion.ordering_items);
      if (initialQuestion.blanks) {
        setBlanks(initialQuestion.blanks.map((b) => ({ id: b.id, label: b.label || b.id, accepted_answers: b.accepted_answers })));
      }
      if (initialQuestion.short_answer_config) {
        setShortAnswerSample(initialQuestion.short_answer_config.sample_answer || '');
        setShortAnswerVariants(initialQuestion.short_answer_config.variants?.join(', ') || '');
        setShortAnswerUnit(initialQuestion.short_answer_config.unit || '');
        setShortAnswerTolerance(initialQuestion.short_answer_config.numeric_tolerance || 0);
      }
      if (initialQuestion.rubric) setRubricItems(initialQuestion.rubric);
      if (initialQuestion.passage_text) setPassageText(initialQuestion.passage_text);
    } else {
      // Defaults for new question
      setQuestionType('single_choice');
      setDifficulty('thong_hieu');
      setQuestionText('');
      setExplanation('');
      setOptions([
        { id: 'A', text: '', is_correct: true },
        { id: 'B', text: '', is_correct: false },
        { id: 'C', text: '', is_correct: false },
        { id: 'D', text: '', is_correct: false }
      ]);
      setSingleCorrectAnswer('A');
      setMultipleCorrectAnswers(['A']);
    }
    setErrorMsg('');
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions([...options, { id: nextChar, text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== index);
    setOptions(newOpts);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOpts = [...options];
    newOpts[index].text = text;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorMsg('Vui lòng nhập nội dung đề bài câu hỏi');
      return;
    }

    let correctAnswerPayload: any = null;

    if (questionType === 'single_choice') {
      const emptyOpts = options.filter((o) => !o.text.trim());
      if (emptyOpts.length > 0) {
        setErrorMsg('Vui lòng điền nội dung cho tất cả các phương án trắc nghiệm');
        return;
      }
      correctAnswerPayload = singleCorrectAnswer;
    } else if (questionType === 'multiple_choice') {
      if (multipleCorrectAnswers.length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất 1 đáp án đúng cho dạng Nhiều đáp án');
        return;
      }
      correctAnswerPayload = multipleCorrectAnswers;
    } else if (questionType === 'true_false') {
      const emptySt = statements.filter((s) => !s.text.trim());
      if (emptySt.length > 0) {
        setErrorMsg('Vui lòng điền đầy đủ các ý mệnh đề');
        return;
      }
      const ansObj: Record<string, boolean> = {};
      statements.forEach((s) => {
        ansObj[s.id] = s.is_correct;
      });
      correctAnswerPayload = ansObj;
    } else if (questionType === 'matching') {
      const ansObj: Record<string, string> = {};
      matchingPairs.forEach((p) => {
        ansObj[p.left_id] = p.right_id;
      });
      correctAnswerPayload = ansObj;
    } else if (questionType === 'ordering') {
      correctAnswerPayload = orderingItems.map((o) => o.id);
    } else if (questionType === 'fill_blank') {
      const ansObj: Record<string, string> = {};
      blanks.forEach((b) => {
        ansObj[b.id] = b.accepted_answers[0] || '';
      });
      correctAnswerPayload = ansObj;
    } else if (questionType === 'short_answer') {
      if (!shortAnswerSample.trim()) {
        setErrorMsg('Vui lòng nhập đáp án mẫu cho câu trả lời ngắn');
        return;
      }
      correctAnswerPayload = shortAnswerSample.trim();
    } else if (questionType === 'essay') {
      correctAnswerPayload = essayAnswer.trim() || 'Chấm theo Rubric';
    } else if (questionType === 'passage') {
      correctAnswerPayload = 'Xem chi tiết các câu con';
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Question> = {
        question_text: questionText,
        question_type: questionType,
        difficulty,
        subject_name: subjectName,
        grade_name: gradeName,
        chapter_name: chapterName,
        lesson_name: lessonName,
        tags,
        points: Number(points) || 1.0,
        status,
        explanation,
        correct_answer: correctAnswerPayload,
        options: (questionType === 'single_choice' || questionType === 'multiple_choice') ? options : [],
        statements: questionType === 'true_false' ? statements : undefined,
        matching_pairs: questionType === 'matching' ? matchingPairs : undefined,
        ordering_items: questionType === 'ordering' ? orderingItems : undefined,
        blanks: questionType === 'fill_blank' ? blanks : undefined,
        short_answer_config: questionType === 'short_answer' ? {
          sample_answer: shortAnswerSample,
          variants: shortAnswerVariants.split(',').map((v) => v.trim()).filter(Boolean),
          unit: shortAnswerUnit,
          numeric_tolerance: Number(shortAnswerTolerance) || 0
        } : undefined,
        rubric: questionType === 'essay' ? rubricItems : undefined,
        passage_text: questionType === 'passage' ? passageText : undefined
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi lưu câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? `Chỉnh sửa câu hỏi (${initialQuestion?.code})` : 'Soạn thảo câu hỏi mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ công thức toán KaTeX ($x^2$), hình ảnh và 9 dạng câu hỏi chuẩn Bộ GD&ĐT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showPreview ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Ẩn xem trước' : 'Hiện xem trước'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Editor & Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* LEFT: FORM INPUTS (Col 7 or 12) */}
          <form onSubmit={handleSubmit} className={`${showPreview ? 'md:col-span-7' : 'md:col-span-12'} p-6 space-y-5 overflow-y-auto`}>
            
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* General Classification metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                <select
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden bg-white"
                >
                  <option value="Toán Học">Toán Học</option>
                  <option value="Vật Lý">Vật Lý</option>
                  <option value="Hóa Học">Hóa Học</option>
                  <option value="Sinh Học">Sinh Học</option>
                  <option value="Ngữ Văn">Ngữ Văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Lịch Sử">Lịch Sử</option>
                  <option value="Địa Lý">Địa Lý</option>
                  <option value="Tin Học">Tin Học</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden bg-white"
                >
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dạng câu hỏi (9 Loại)</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="w-full p-2 border border-blue-300 bg-blue-50/50 rounded-xl text-xs font-bold text-blue-900 outline-hidden"
                >
                  <option value="single_choice">1. Một đáp án đúng</option>
                  <option value="multiple_choice">2. Nhiều đáp án đúng</option>
                  <option value="true_false">3. Đúng / Sai từng ý</option>
                  <option value="matching">4. Ghép đôi (Matching)</option>
                  <option value="ordering">5. Sắp xếp thứ tự</option>
                  <option value="fill_blank">6. Điền khuyết</option>
                  <option value="short_answer">7. Trả lời ngắn</option>
                  <option value="essay">8. Tự luận & Rubric</option>
                  <option value="passage">9. Tình huống / Đoạn văn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden bg-white"
                >
                  <option value="nhan_biet">Nhận biết</option>
                  <option value="thong_hieu">Thông hiểu</option>
                  <option value="van_dung">Vận dụng</option>
                  <option value="van_dung_cao">Vận dụng cao</option>
                </select>
              </div>
            </div>

            {/* Chapter & Lesson */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chương / Chuyên đề</label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="Vd: Mệnh đề & Tập hợp"
                  className="w-full p-2 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bài học / Chủ đề</label>
                <input
                  type="text"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  placeholder="Vd: Bài 2: Dao động điều hòa"
                  className="w-full p-2 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>
            </div>

            {/* Passage Text (nếu là dạng 9) */}
            {questionType === 'passage' && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-purple-900">
                  Đoạn văn / Ngữ cảnh chung (Passage / Stimulus) *
                </label>
                <textarea
                  rows={4}
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  placeholder="Nhập đoạn văn, trích dẫn bài báo, tài liệu đọc hiểu..."
                  className="w-full p-3 border border-purple-200 rounded-xl text-xs outline-hidden bg-white"
                />
              </div>
            )}

            {/* Question Stem */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nội dung câu hỏi (Stem) *
                </label>
                <span className="text-[11px] text-slate-400">
                  Công thức toán: kẹp trong dấu <code className="bg-slate-100 px-1 rounded">$...$</code>
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Nhập nội dung câu hỏi... Vd: Cho phương trình $x^2 - 4x + 3 = 0$..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* TYPE-SPECIFIC EDITORS */}

            {/* 1. Single Choice */}
            {questionType === 'single_choice' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Các phương án trả lời (Chọn nút tròn để chỉ định đáp án đúng):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm phương án
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="singleCorrect"
                          checked={singleCorrectAnswer === opt.id}
                          onChange={() => setSingleCorrectAnswer(opt.id)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span className="font-bold text-xs text-slate-700">{opt.id}</span>
                      </label>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Nội dung phương án ${opt.id}...`}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Multiple Choice */}
            {questionType === 'multiple_choice' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Nhiều đáp án đúng (Đánh dấu checkbox vào các phương án đúng):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm phương án
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => {
                    const isChecked = multipleCorrectAnswers.includes(opt.id);
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMultipleCorrectAnswers([...multipleCorrectAnswers, opt.id]);
                              } else {
                                setMultipleCorrectAnswers(multipleCorrectAnswers.filter((id) => id !== opt.id));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="font-bold text-xs text-slate-700">{opt.id}</span>
                        </label>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`Nội dung phương án ${opt.id}...`}
                          className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. True / False statements */}
            {questionType === 'true_false' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Các mệnh đề con (Từng ý ĐÚNG / SAI):</label>
                  <button
                    type="button"
                    onClick={() =>
                      setStatements([
                        ...statements,
                        { id: `st-${statements.length + 1}`, text: '', is_correct: true }
                      ])
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm mệnh đề
                  </button>
                </div>

                <div className="space-y-2">
                  {statements.map((st, idx) => (
                    <div key={st.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-12 shrink-0">Ý {idx + 1}:</span>
                      <input
                        type="text"
                        value={st.text}
                        onChange={(e) => {
                          const next = [...statements];
                          next[idx].text = e.target.value;
                          setStatements(next);
                        }}
                        placeholder="Nhập nội dung mệnh đề..."
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                      />
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...statements];
                            next[idx].is_correct = true;
                            setStatements(next);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                            st.is_correct ? 'bg-emerald-600 text-white' : 'text-slate-500'
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...statements];
                            next[idx].is_correct = false;
                            setStatements(next);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                            !st.is_correct ? 'bg-rose-600 text-white' : 'text-slate-500'
                          }`}
                        >
                          Sai
                        </button>
                      </div>
                      {statements.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setStatements(statements.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Matching */}
            {questionType === 'matching' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Cặp ghép đôi (Cột trái ➔ Cột phải):</label>
                  <button
                    type="button"
                    onClick={() =>
                      setMatchingPairs([
                        ...matchingPairs,
                        { left_id: `A${matchingPairs.length + 1}`, left_text: '', right_id: `B${matchingPairs.length + 1}`, right_text: '' }
                      ])
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cặp
                  </button>
                </div>

                <div className="space-y-2">
                  {matchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pair.left_text}
                        onChange={(e) => {
                          const next = [...matchingPairs];
                          next[idx].left_text = e.target.value;
                          setMatchingPairs(next);
                        }}
                        placeholder={`Mục ${idx + 1} (Vế trái)`}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                      />
                      <span className="text-slate-400 font-bold">➔</span>
                      <input
                        type="text"
                        value={pair.right_text}
                        onChange={(e) => {
                          const next = [...matchingPairs];
                          next[idx].right_text = e.target.value;
                          setMatchingPairs(next);
                        }}
                        placeholder={`Đáp án nối ${idx + 1} (Vế phải)`}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white font-medium text-blue-700"
                      />
                      {matchingPairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Ordering */}
            {questionType === 'ordering' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Các phần tử theo thứ tự đúng:</label>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderingItems([
                        ...orderingItems,
                        { id: `ord-${orderingItems.length + 1}`, text: '', correct_order: orderingItems.length + 1 }
                      ])
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm phần tử
                  </button>
                </div>

                <div className="space-y-2">
                  {orderingItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const next = [...orderingItems];
                          next[idx].text = e.target.value;
                          setOrderingItems(next);
                        }}
                        placeholder={`Sự kiện / bước số ${idx + 1}...`}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                      />
                      {orderingItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOrderingItems(orderingItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Fill blanks */}
            {questionType === 'fill_blank' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Cấu hình ô trống (Ký hiệu [blank1], [blank2] trong đề bài):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const num = blanks.length + 1;
                      setBlanks([...blanks, { id: `blank${num}`, label: `Ô trống [blank${num}]`, accepted_answers: [''] }]);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm ô trống
                  </button>
                </div>

                <div className="space-y-2">
                  {blanks.map((b, idx) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 shrink-0 w-24">[{b.id}]</span>
                      <input
                        type="text"
                        value={b.accepted_answers.join(', ')}
                        onChange={(e) => {
                          const next = [...blanks];
                          next[idx].accepted_answers = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                          setBlanks(next);
                        }}
                        placeholder="Các đáp án chấp nhận (cách nhau dấu phẩy, vd: but, yet)..."
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white font-mono"
                      />
                      {blanks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBlanks(blanks.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Short answer */}
            {questionType === 'short_answer' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-800 block">Cấu hình câu trả lời ngắn:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Đáp án mẫu chuẩn *</label>
                    <input
                      type="text"
                      required
                      value={shortAnswerSample}
                      onChange={(e) => setShortAnswerSample(e.target.value)}
                      placeholder="Vd: 30"
                      className="w-full p-2 border border-slate-200 rounded-xl outline-hidden bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Đơn vị đo (nếu có)</label>
                    <input
                      type="text"
                      value={shortAnswerUnit}
                      onChange={(e) => setShortAnswerUnit(e.target.value)}
                      placeholder="Vd: m/s hoặc kg"
                      className="w-full p-2 border border-slate-200 rounded-xl outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Các biến thể chấp nhận (cách nhau dấu phẩy)</label>
                    <input
                      type="text"
                      value={shortAnswerVariants}
                      onChange={(e) => setShortAnswerVariants(e.target.value)}
                      placeholder="Vd: 30 m/s, 30m/s, 30.0"
                      className="w-full p-2 border border-slate-200 rounded-xl outline-hidden bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Dung sai số (Numeric tolerance ±)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shortAnswerTolerance}
                      onChange={(e) => setShortAnswerTolerance(Number(e.target.value))}
                      placeholder="Vd: 0.1"
                      className="w-full p-2 border border-slate-200 rounded-xl outline-hidden bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. Essay & Rubric */}
            {questionType === 'essay' && (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Đáp án tham khảo / Hướng dẫn chấm:</label>
                  <textarea
                    rows={3}
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    placeholder="Nêu các luận điểm chính cần đạt và hướng dẫn cho giáo viên..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Rubric tiêu chí chấm điểm:</label>
                    <button
                      type="button"
                      onClick={() =>
                        setRubricItems([
                          ...rubricItems,
                          { id: `rb-${rubricItems.length + 1}`, criteria: '', max_points: 0.5, description: '' }
                        ])
                      }
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                    </button>
                  </div>

                  {rubricItems.map((rb, idx) => (
                    <div key={rb.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rb.criteria}
                          onChange={(e) => {
                            const next = [...rubricItems];
                            next[idx].criteria = e.target.value;
                            setRubricItems(next);
                          }}
                          placeholder={`Tên tiêu chí ${idx + 1}...`}
                          className="flex-1 p-1.5 border border-slate-200 rounded-lg outline-hidden font-medium"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            step="0.25"
                            value={rb.max_points}
                            onChange={(e) => {
                              const next = [...rubricItems];
                              next[idx].max_points = Number(e.target.value);
                              setRubricItems(next);
                            }}
                            className="w-16 p-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-bold text-blue-600"
                          />
                          <span className="text-slate-500 text-[11px]">điểm</span>
                        </div>
                        {rubricItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRubricItems(rubricItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={rb.description}
                        onChange={(e) => {
                          const next = [...rubricItems];
                          next[idx].description = e.target.value;
                          setRubricItems(next);
                        }}
                        placeholder="Mô tả mức đạt để giáo viên cho trọn điểm..."
                        className="w-full p-1.5 border border-slate-100 rounded-lg outline-hidden text-slate-500 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời giải chi tiết / Hướng dẫn giải
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Ghi chú các bước giải và căn cứ lý thuyết..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-hidden"
              />
            </div>

            {/* Tags & Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thẻ phân loại (Tags, cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Vd: Đại số, Ôn thi THPT, Mức độ 3"
                  className="w-full p-2 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm mặc định</label>
                <input
                  type="number"
                  step="0.25"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật câu hỏi' : 'Lưu vào ngân hàng'}</span>
              </button>
            </div>
          </form>

          {/* RIGHT: LIVE PREVIEW PANE (Col 5) */}
          {showPreview && (
            <div className="hidden md:flex md:col-span-5 p-6 flex-col bg-slate-50/40 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Live Preview (Xem trước hiển thị)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {difficulty}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                {/* Subject & Grade tags */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                    {subjectName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                    {gradeName}
                  </span>
                </div>

                {/* Passage if any */}
                {questionType === 'passage' && passageText && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 italic leading-relaxed text-xs">
                    <MathRenderer content={passageText} />
                  </div>
                )}

                {/* Stem */}
                <div className="text-slate-900 font-semibold text-sm leading-relaxed">
                  <MathRenderer content={questionText || 'Nội dung câu hỏi sẽ hiển thị trực quan ở đây...'} />
                </div>

                {/* Options / Statements Preview */}
                {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
                  <div className="space-y-1.5 pt-1">
                    {options.map((opt) => {
                      const isCorrect = questionType === 'single_choice'
                        ? singleCorrectAnswer === opt.id
                        : multipleCorrectAnswers.includes(opt.id);

                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            isCorrect ? 'bg-emerald-50 border-emerald-300 font-medium text-emerald-900' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {opt.id}
                          </span>
                          <span className="flex-1">
                            <MathRenderer content={opt.text || `(Phương án ${opt.id})`} />
                          </span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {questionType === 'true_false' && (
                  <div className="space-y-1.5 pt-1">
                    {statements.map((st, i) => (
                      <div key={st.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span>Ý {i + 1}: {st.text || '...'}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${st.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {st.is_correct ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'matching' && (
                  <div className="space-y-1.5 pt-1">
                    {matchingPairs.map((p, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span>{p.left_text || `Vế trái ${i + 1}`}</span>
                        <span className="text-slate-400">➔</span>
                        <span className="font-semibold text-blue-600">{p.right_text || `Vế phải ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'short_answer' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <span className="text-slate-500 block text-[11px]">Đáp án mẫu:</span>
                    <span className="font-mono font-bold text-emerald-900">{shortAnswerSample || '...'} {shortAnswerUnit}</span>
                  </div>
                )}

                {/* Explanation */}
                {explanation && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 text-xs text-slate-700">
                    <strong className="text-blue-900 block mb-0.5">Lời giải:</strong>
                    <MathRenderer content={explanation} />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
