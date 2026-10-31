import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Quiz, Question, QuestionType } from '../../types';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import {
  HelpCircle,
  Plus,
  Clock,
  Award,
  Shuffle,
  FileQuestion,
  Users,
  CheckCircle2,
  Trash2,
  BookOpen
} from 'lucide-react';

export const QuizPage: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'question_bank'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Question create modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');

  const loadData = async () => {
    const qzs = await DataService.getQuizzes();
    const qs = await DataService.getQuestions();
    setQuizzes(qzs);
    setQuestions(qs);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    await DataService.createQuestion({
      teacher_id: 'user-teacher-1',
      subject_id: 'sub-math',
      subject_name: 'Toán Học',
      question_text: questionText,
      question_type: questionType,
      options: [
        { id: 'A', text: optionA || 'Phương án A' },
        { id: 'B', text: optionB || 'Phương án B' },
        { id: 'C', text: optionC || 'Phương án C' },
        { id: 'D', text: optionD || 'Phương án D' }
      ],
      correct_answer: correctAnswer,
      explanation,
      points: 2.0
    });

    setIsQuestionModalOpen(false);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExplanation('');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kiểm tra & Ngân hàng câu hỏi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xây dựng đề kiểm tra trực tuyến, thiết lập thời gian làm bài và đảo câu hỏi tự động
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'question_bank' ? (
            <button
              onClick={() => setIsQuestionModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/teacher/quizzes/create')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề kiểm tra mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-1">
        <Tabs
          tabs={[
            { id: 'quizzes', label: 'Đề kiểm tra trực tuyến', badge: quizzes.length },
            { id: 'question_bank', label: 'Ngân hàng câu hỏi', badge: questions.length }
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* QUIZZES TAB */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {quiz.subject_name}
                  </span>
                  <span className="text-slate-500 font-medium">{quiz.class_name}</span>
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-1">{quiz.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{quiz.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.duration_minutes} phút
                  </span>
                  <span className="flex items-center gap-1">
                    <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.questions?.length || 5} câu hỏi
                  </span>
                  <span className="flex items-center gap-1">
                    <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.shuffle_questions ? 'Đảo câu & đáp án' : 'Thứ tự cố định'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {quiz.attempt_count} lượt làm
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => alert('Xem thống kê chi tiết kết quả bài thi')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                >
                  Xem kết quả thi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {activeTab === 'question_bank' && (
        <div className="space-y-4">
          <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-blue-900">
                Phân hệ Ngân hàng câu hỏi thông minh đã được nâng cấp toàn diện!
              </h4>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Hỗ trợ 9 dạng câu hỏi chuẩn Bộ GD&ĐT, công thức Toán KaTeX, Wizard tạo câu hỏi bằng AI, kiểm duyệt và xuất đề thi A4.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/teacher/question-bank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
            >
              <span>Vào Ngân hàng câu hỏi ➔</span>
            </button>
          </div>

          <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs shrink-0">
                    Câu #{idx + 1}
                  </span>
                  <p className="font-semibold text-sm text-slate-900">{q.question_text}</p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                  {q.question_type}
                </span>
              </div>

              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                  {q.options.map((opt) => {
                    const isCorrect = opt.id === q.correct_answer;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white text-center font-bold text-slate-600 flex items-center justify-center border border-slate-200">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                        {isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && (
                <div className="pl-8 text-xs text-slate-500 bg-slate-50/50 p-2.5 rounded-xl">
                  <strong className="text-slate-700">Lời giải chi tiết:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Create Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title="Thêm câu hỏi vào ngân hàng"
        subtitle="Soạn thảo câu hỏi trắc nghiệm hoặc tự luận"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loại câu hỏi</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            >
              <option value="single_choice">Một đáp án đúng (Single Choice)</option>
              <option value="multiple_choice">Nhiều đáp án đúng (Multiple Choice)</option>
              <option value="true_false">Đúng / Sai (True / False)</option>
              <option value="short_answer">Trả lời ngắn</option>
              <option value="essay">Tự luận</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung câu hỏi *
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Nhập đề bài câu hỏi..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          {questionType === 'single_choice' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Các phương án trả lời:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Phương án A"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Phương án B"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Phương án C"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Phương án D"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg outline-hidden"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đáp án chính xác:
                </label>
                <div className="flex gap-4 text-xs font-bold text-slate-700">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="correct"
                        checked={correctAnswer === opt}
                        onChange={() => setCorrectAnswer(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giải thích / Lời giải chi tiết
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Ghi chú các bước giải để học sinh đối chiếu sau khi làm xong..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Lưu câu hỏi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
