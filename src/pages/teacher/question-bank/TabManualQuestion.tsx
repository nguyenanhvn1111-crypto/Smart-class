import React, { useState, useRef, useEffect } from 'react';
import { Question, QuestionType, QuestionDifficulty, RubricItem, BlankItem } from '../../../types';
import { MathRenderer } from '../../../components/common/MathRenderer';
import {
  PenTool,
  CheckCircle2,
  ChevronDown,
  Plus,
  Trash2,
  Eye,
  Save,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
  Check,
  RotateCcw
} from 'lucide-react';

interface TabManualQuestionProps {
  onSaveQuestion: (question: Partial<Question>) => Promise<void>;
  onViewRepository: () => void;
  defaultSubject?: string;
  defaultGrade?: string;
}

type ComboboxTypeKey = 'single_choice' | 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank';

interface ComboboxOption {
  key: ComboboxTypeKey;
  label: string;
  subLabel: string;
  badge: string;
}

const COMBOBOX_OPTIONS: ComboboxOption[] = [
  {
    key: 'single_choice',
    label: 'Trắc Nghiệm - Pick One (1 đáp án)',
    subLabel: 'Học sinh chỉ được chọn duy nhất 1 phương án đúng',
    badge: '1 Đáp án'
  },
  {
    key: 'multiple_choice',
    label: 'Nhiều đáp án - Pick many',
    subLabel: 'Học sinh có thể chọn nhiều phương án đúng cùng lúc',
    badge: 'Nhiều đáp án'
  },
  {
    key: 'true_false',
    label: 'Đúng / Sai',
    subLabel: 'Mỗi mệnh đề được đánh giá là Đúng hoặc Sai',
    badge: 'Đúng/Sai'
  },
  {
    key: 'essay',
    label: 'Tự luận',
    subLabel: 'Trả lời bằng bài viết tự do kết hợp thang điểm Rubric',
    badge: 'Tự luận'
  },
  {
    key: 'fill_blank',
    label: 'Điền Khuyết',
    subLabel: 'Điền từ ngữ hoặc số vào các vị trí khuyết trong câu',
    badge: 'Điền khuyết'
  }
];

export const TabManualQuestion: React.FC<TabManualQuestionProps> = ({
  onSaveQuestion,
  onViewRepository,
  defaultSubject = 'Toán Học',
  defaultGrade = 'Khối 10'
}) => {
  // Dòng 1: Môn học & Khối lớp
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('thong_hieu');
  const [points, setPoints] = useState(1.0);

  // Dòng 2: Combobox Loại câu hỏi
  const [selectedCombobox, setSelectedCombobox] = useState<ComboboxTypeKey>('single_choice');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [chapterName, setChapterName] = useState('Chương 1: Kiến thức trọng tâm');
  const [lessonName, setLessonName] = useState('');
  const [tags, setTags] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');

  // 1 & 2: Options for Pick One & Pick Many
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' }
  ]);
  const [singleCorrectAnswer, setSingleCorrectAnswer] = useState('A');
  const [multipleCorrectAnswers, setMultipleCorrectAnswers] = useState<string[]>(['A']);

  // 3: True / False Statements
  const [statements, setStatements] = useState<{ id: string; text: string; is_correct: boolean }[]>([
    { id: 'st1', text: '', is_correct: true },
    { id: 'st2', text: '', is_correct: false },
    { id: 'st3', text: '', is_correct: true },
    { id: 'st4', text: '', is_correct: false }
  ]);

  // 4: Essay Rubric & Sample
  const [essayAnswer, setEssayAnswer] = useState('');
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([
    { id: 'rb-1', criteria: 'Hiểu đúng yêu cầu bài toán và công thức cơ bản', max_points: 0.5, description: 'Trình bày rõ ràng' },
    { id: 'rb-2', criteria: 'Các bước biến đổi logic và tính toán chính xác', max_points: 0.5, description: 'Đúng đơn vị' }
  ]);

  // 5: Fill Blanks
  const [blanks, setBlanks] = useState<BlankItem[]>([
    { id: 'blank1', label: 'Ô trống [blank1]', accepted_answers: [''], case_sensitive: false }
  ]);

  // Save states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState('');

  // Close combobox on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick insert math formula
  const insertFormula = (latex: string) => {
    setQuestionText((prev) => prev + ` $${latex}$ `);
  };

  // Option handlers for Pick One / Many
  const updateOptionText = (idx: number, text: string) => {
    setOptions((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], text };
      return clone;
    });
  };

  const addOption = () => {
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { id: nextChar, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần tối thiểu 2 phương án!');
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleMultipleChoiceAnswer = (id: string) => {
    setMultipleCorrectAnswers((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
  };

  // Statement handlers for True/False
  const updateStatementText = (idx: number, text: string) => {
    setStatements((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], text };
      return clone;
    });
  };

  const toggleStatementCorrect = (idx: number, val: boolean) => {
    setStatements((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], is_correct: val };
      return clone;
    });
  };

  const addStatement = () => {
    const id = `st${statements.length + 1}`;
    setStatements((prev) => [...prev, { id, text: '', is_correct: true }]);
  };

  const removeStatement = (idx: number) => {
    if (statements.length <= 2) {
      alert('Câu hỏi Đúng/Sai cần tối thiểu 2 mệnh đề!');
      return;
    }
    setStatements((prev) => prev.filter((_, i) => i !== idx));
  };

  // Rubric handlers for Essay
  const updateRubric = (idx: number, field: keyof RubricItem, val: any) => {
    setRubricItems((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: val };
      return clone;
    });
  };

  const addRubric = () => {
    setRubricItems((prev) => [
      ...prev,
      { id: `rb-${Date.now()}`, criteria: '', max_points: 0.5, description: '' }
    ]);
  };

  const removeRubric = (idx: number) => {
    setRubricItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Blanks handlers
  const updateBlankAnswer = (idx: number, rawCsv: string) => {
    const list = rawCsv.split(',').map((s) => s.trim()).filter(Boolean);
    setBlanks((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], accepted_answers: list };
      return clone;
    });
  };

  const addBlank = () => {
    const num = blanks.length + 1;
    setBlanks((prev) => [
      ...prev,
      { id: `blank${num}`, label: `Ô trống [blank${num}]`, accepted_answers: [''] }
    ]);
    setQuestionText((prev) => prev + ` [blank${num}] `);
  };

  const removeBlank = (idx: number) => {
    setBlanks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save handler
  const handleSave = async (continueCreating = false) => {
    if (!questionText.trim()) {
      alert('Vui lòng nhập nội dung đề bài câu hỏi!');
      return;
    }

    setIsSubmitting(true);

    const questionCode = `CH-${subject.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    let correct_answer: any = singleCorrectAnswer;
    if (selectedCombobox === 'multiple_choice') {
      correct_answer = multipleCorrectAnswers.join(',');
    } else if (selectedCombobox === 'true_false') {
      correct_answer = statements.map((s) => (s.is_correct ? 'Đ' : 'S')).join(',');
    } else if (selectedCombobox === 'essay') {
      correct_answer = essayAnswer;
    } else if (selectedCombobox === 'fill_blank') {
      const map: Record<string, string[]> = {};
      blanks.forEach((b) => {
        map[b.id] = b.accepted_answers;
      });
      correct_answer = JSON.stringify(map);
    }

    const payload: Partial<Question> = {
      code: questionCode,
      question_text: questionText,
      question_type: selectedCombobox,
      difficulty,
      subject_name: subject,
      grade_name: grade,
      chapter_name: chapterName,
      lesson_name: lessonName,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      points,
      status: 'approved',
      source_type: 'teacher_composed',
      explanation,
      options:
        selectedCombobox === 'single_choice' || selectedCombobox === 'multiple_choice'
          ? options.map((opt) => ({
              ...opt,
              is_correct:
                selectedCombobox === 'single_choice'
                  ? opt.id === singleCorrectAnswer
                  : multipleCorrectAnswers.includes(opt.id)
            }))
          : [],
      correct_answer,
      statements: selectedCombobox === 'true_false' ? statements : undefined,
      rubric: selectedCombobox === 'essay' ? rubricItems : undefined,
      blanks: selectedCombobox === 'fill_blank' ? blanks : undefined
    };

    try {
      await onSaveQuestion(payload);
      setLastSavedMessage(`Đã lưu thành công câu hỏi: ${questionCode} vào Ngân hàng.`);

      if (continueCreating) {
        setQuestionText('');
        setExplanation('');
        setLessonName('');
        setOptions([
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ]);
        setSingleCorrectAnswer('A');
        setMultipleCorrectAnswers(['A']);
      }
    } catch (e) {
      alert('Không thể lưu câu hỏi. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOptionObj =
    COMBOBOX_OPTIONS.find((c) => c.key === selectedCombobox) || COMBOBOX_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Tạo câu hỏi bằng tay (Thủ công)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Biên soạn câu hỏi từng bước với đầy đủ công thức toán học KaTeX, cấu hình đáp án trực quan và thang điểm chuẩn Bộ GD&ĐT.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* ======================================================== */}
        {/* DÒNG ĐẦU: CHỌN MÔN HỌC & KHỐI LỚP (KÈM MỨC ĐỘ & ĐIỂM) */}
        {/* ======================================================== */}
        <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Dòng 1: Thiết lập Thông tin Chung (Môn học & Khối lớp)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Môn học */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">Môn học *</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-gray-800"
              >
                <option value="Toán Học">Toán Học</option>
                <option value="Vật Lý">Vật Lý</option>
                <option value="Hóa Học">Hóa Học</option>
                <option value="Sinh Học">Sinh Học</option>
                <option value="Ngữ Văn">Ngữ Văn</option>
                <option value="Lịch Sử">Lịch Sử</option>
                <option value="Địa Lý">Địa Lý</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tin Học">Tin Học</option>
                <option value="GDCD">GDCD</option>
              </select>
            </div>

            {/* Khối lớp */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">Khối lớp *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-gray-800"
              >
                <option value="Khối 6">Khối 6</option>
                <option value="Khối 7">Khối 7</option>
                <option value="Khối 8">Khối 8</option>
                <option value="Khối 9">Khối 9</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>

            {/* Mức độ nhận thức */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">Mức độ nhận thức</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-800 font-medium"
              >
                <option value="nhan_biet">Nhận biết</option>
                <option value="thong_hieu">Thông hiểu</option>
                <option value="van_dung">Vận dụng</option>
                <option value="van_dung_cao">Vận dụng cao</option>
              </select>
            </div>

            {/* Thang điểm */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">Điểm số</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="10"
                value={points}
                onChange={(e) => setPoints(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DÒNG 2: COMBOBOX CHỌN LOẠI CÂU HỎI                       */}
        {/* ======================================================== */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
            Dòng 2: Combobox Chọn Loại Câu Hỏi (Nhấp để mở danh sách đáp án)
          </div>

          <div className="relative" ref={comboboxRef}>
            {/* The Combobox Trigger Box */}
            <button
              type="button"
              onClick={() => setIsComboboxOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-emerald-500 hover:border-emerald-600 rounded-xl shadow-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>{selectedOptionObj.label}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {selectedOptionObj.badge}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{selectedOptionObj.subLabel}</div>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-emerald-700 transition-transform duration-200 ${
                  isComboboxOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* The Combobox Dropdown Menu */}
            {isComboboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-emerald-200 p-2 z-30 space-y-1">
                {COMBOBOX_OPTIONS.map((item) => {
                  const isSelected = item.key === selectedCombobox;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSelectedCombobox(item.key);
                        setIsComboboxOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                          : 'hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2">
                          <span>{item.label}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isSelected
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                          {item.subLabel}
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chapter / Topic / Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Chương / Chủ đề</label>
            <input
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="VD: Chương 1: Mệnh đề và tập hợp"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Bài học cụ thể</label>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="VD: Bài 2: Tập hợp và các phép toán"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Thẻ từ khóa (Tags)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="VD: hsg, kiem_tra_1_tiet, on_thi"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Question Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-900">Nội dung câu hỏi (Đề bài) *</label>
            <span className="text-xs text-gray-400">Hỗ trợ LaTeX công thức toán $...$</span>
          </div>

          {/* Quick formula toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs">
            <span className="text-[11px] font-semibold text-gray-500 mr-1">Chèn nhanh:</span>
            {[
              { label: 'Phân số', code: '\\frac{a}{b}' },
              { label: 'Căn bậc hai', code: '\\sqrt{x}' },
              { label: 'Mũ', code: 'x^{2}' },
              { label: 'Cộng trừ', code: '\\pm' },
              { label: 'Vectơ', code: '\\vec{v}' },
              { label: 'Pi', code: '\\pi' },
              { label: 'Alpha', code: '\\alpha' },
              { label: 'Góc', code: '\\widehat{ABC}' }
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertFormula(btn.code)}
                className="px-2 py-1 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded text-gray-700 font-mono text-[11px] transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung đề bài tại đây. Có thể chèn công thức toán như $x^2 + 5x + 6 = 0$ hoặc $\vec{AB} = \vec{CD}$"
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          {/* Live KaTeX Preview */}
          {questionText && (
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Xem trước đề bài (KaTeX):
              </span>
              <div className="text-sm text-gray-900">
                <MathRenderer content={questionText} />
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DYNAMIC ANSWER SECTION BASED ON SELECTED COMBOBOX OPTION */}
        {/* ======================================================== */}
        <div className="pt-2">
          {/* 1. Pick One (1 đáp án) */}
          {selectedCombobox === 'single_choice' && (
            <div className="space-y-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Cấu hình Phương án & Chọn 1 Đáp án Đúng
                  </h4>
                  <p className="text-xs text-gray-500">
                    Tích vào nút radio tròn bên cạnh phương án để chọn đáp án đúng.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm phương án
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isCorrect = singleCorrectAnswer === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="radio"
                          name="singleCorrectRadio"
                          checked={isCorrect}
                          onChange={() => setSingleCorrectAnswer(opt.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {opt.id}
                        </span>
                      </label>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        placeholder={`Nội dung phương án ${opt.id}...`}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Pick Many (Nhiều đáp án) */}
          {selectedCombobox === 'multiple_choice' && (
            <div className="space-y-4 bg-blue-50/20 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Cấu hình Phương án & Chọn Nhiều Đáp án Đúng
                  </h4>
                  <p className="text-xs text-gray-500">
                    Tích vào các ô checkbox để chọn nhiều phương án đúng cùng lúc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm phương án
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isCorrect = multipleCorrectAnswers.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        isCorrect
                          ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isCorrect}
                          onChange={() => toggleMultipleChoiceAnswer(opt.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCorrect
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {opt.id}
                        </span>
                      </label>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                        placeholder={`Nội dung phương án ${opt.id}...`}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Đúng / Sai */}
          {selectedCombobox === 'true_false' && (
            <div className="space-y-4 bg-amber-50/20 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Cấu hình Các Mệnh Đề Đúng / Sai
                  </h4>
                  <p className="text-xs text-gray-500">
                    Nhập nội dung từng mệnh đề và chọn Đúng hoặc Sai cho mỗi ý.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStatement}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm mệnh đề
                </button>
              </div>

              <div className="space-y-3">
                {statements.map((st, idx) => {
                  const labelLetter = String.fromCharCode(97 + idx); // a, b, c, d
                  return (
                    <div
                      key={st.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {labelLetter})
                        </span>
                        <input
                          type="text"
                          value={st.text}
                          onChange={(e) => updateStatementText(idx, e.target.value)}
                          placeholder={`Nội dung mệnh đề ${labelLetter})...`}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleStatementCorrect(idx, true)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            st.is_correct
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatementCorrect(idx, false)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            !st.is_correct
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Sai
                        </button>

                        {statements.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeStatement(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Tự luận */}
          {selectedCombobox === 'essay' && (
            <div className="space-y-4 bg-purple-50/20 p-4 rounded-xl border border-purple-200">
              <h4 className="font-bold text-sm text-gray-900">
                Gợi ý Đáp án & Thang điểm Chi tiết (Rubric)
              </h4>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Bài giải mẫu / Gợi ý đáp án
                </label>
                <textarea
                  value={essayAnswer}
                  onChange={(e) => setEssayAnswer(e.target.value)}
                  rows={3}
                  placeholder="Ghi các bước chính hoặc dàn ý đáp án để giáo viên chấm thi tham khảo..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Rubric Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Tiêu chí chấm điểm (Rubric):</span>
                  <button
                    type="button"
                    onClick={addRubric}
                    className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                  </button>
                </div>

                {rubricItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 text-xs"
                  >
                    <span className="font-semibold text-gray-500 w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      value={item.criteria}
                      onChange={(e) => updateRubric(idx, 'criteria', e.target.value)}
                      placeholder="Tên tiêu chí (VD: Vẽ đúng đồ thị)"
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      step="0.25"
                      value={item.max_points}
                      onChange={(e) =>
                        updateRubric(idx, 'max_points', parseFloat(e.target.value) || 0)
                      }
                      placeholder="Điểm"
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-center"
                    />
                    <button
                      type="button"
                      onClick={() => removeRubric(idx)}
                      className="text-gray-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Điền Khuyết */}
          {selectedCombobox === 'fill_blank' && (
            <div className="space-y-4 bg-teal-50/20 p-4 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Cấu hình Vị trí Điền Khuyết [blank]
                  </h4>
                  <p className="text-xs text-gray-500">
                    Sử dụng cú pháp <code className="bg-teal-100 text-teal-800 px-1 py-0.5 rounded font-mono">[blank1]</code> trong đề bài.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBlank}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm ô trống
                </button>
              </div>

              <div className="space-y-3">
                {blanks.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
                  >
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                      [{b.id}]
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={b.accepted_answers.join(', ')}
                        onChange={(e) => updateBlankAnswer(idx, e.target.value)}
                        placeholder="Các đáp án chấp nhận (ngăn cách bởi dấu phẩy, VD: Pytago, Pi-ta-go)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    {blanks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBlank(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explanation / Solution */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">
            Lời giải chi tiết & Hướng dẫn sư phạm (Tùy chọn)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Ghi lời giải chi tiết, các bước suy luận hoặc nhắc nhở những sai sót học sinh hay mắc..."
            className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Success message banner */}
        {lastSavedMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {lastSavedMessage}
            </span>
            <button
              onClick={onViewRepository}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Xem trong Kho</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setQuestionText('');
              setExplanation('');
              setLessonName('');
            }}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm mới biểu mẫu</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-4 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              Lưu & Tiếp tục tạo mới
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Lưu vào Ngân hàng câu hỏi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
