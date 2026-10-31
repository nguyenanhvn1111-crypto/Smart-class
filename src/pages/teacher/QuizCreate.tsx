import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { aiAssistant } from '../../services/aiService';
import { Question } from '../../types';
import { MathRenderer } from '../../components/common/MathRenderer';
import {
  HelpCircle,
  Clock,
  Shuffle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';

export const QuizCreate: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const navigate = useNavigate();
  const location = useLocation();
  const preSelected: Question[] = (location.state as any)?.preSelectedQuestions || [];

  const [title, setTitle] = useState(preSelected.length > 0 ? `Đề kiểm tra (${preSelected.length} câu đã chọn)` : '');
  const [description, setDescription] = useState(preSelected.length > 0 ? 'Đề kiểm tra được tạo từ Ngân hàng câu hỏi thông minh' : '');
  const [classId, setClassId] = useState(selectedClassId || 'cls-10a1');
  const [subjectId, setSubjectId] = useState('sub-math');
  const [duration, setDuration] = useState(15);
  const [passScore, setPassScore] = useState(5.0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Selected questions
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    DataService.getQuestions().then((qs) => {
      setAvailableQuestions(qs);
      if (preSelected.length > 0) {
        setSelectedQuestionIds(new Set(preSelected.map((q) => q.id)));
      } else {
        setSelectedQuestionIds(new Set(qs.slice(0, 3).map((q) => q.id)));
      }
    });
  }, []);

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateQuestionsAI = async () => {
    setIsAiLoading(true);
    try {
      const generated = await aiAssistant.generateQuestions({
        subject: 'Toán Học',
        topic: title || 'Mệnh đề và Tập hợp',
        count: 3,
        questionType: 'single_choice'
      });

      for (const g of generated) {
        if (g.question_text) {
          const created = await DataService.createQuestion({
            teacher_id: 'user-teacher-1',
            subject_id: 'sub-math',
            subject_name: 'Toán Học',
            question_text: g.question_text,
            question_type: (g.question_type as any) || 'single_choice',
            options: g.options || [],
            correct_answer: g.correct_answer || 'A',
            explanation: g.explanation,
            points: g.points || 2
          });
          setAvailableQuestions((prev) => [created, ...prev]);
          setSelectedQuestionIds((prev) => new Set([...prev, created.id]));
        }
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra');
      return;
    }

    const cls = classes.find((c) => c.id === classId);
    const chosenQuestions = availableQuestions.filter((q) => selectedQuestionIds.has(q.id));

    await DataService.createQuiz({
      class_id: classId,
      class_name: cls?.name || '10A1',
      teacher_id: 'user-teacher-1',
      subject_id: subjectId,
      subject_name: 'Toán Học',
      title,
      description,
      duration_minutes: duration,
      pass_score: passScore,
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      is_published: true,
      questions: chosenQuestions,
      total_points: chosenQuestions.reduce((acc, q) => acc + (q.points || 2), 0)
    });

    navigate('/teacher/quizzes');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/teacher/quizzes')}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tạo đề kiểm tra / Quiz trực tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cấu hình thời gian làm bài, tỷ lệ câu hỏi và lấy từ ngân hàng câu hỏi
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">1. Thông tin chung về đề thi</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề bài kiểm tra *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra 15 phút: Đại số & Hệ phương trình"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giao cho lớp</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-hidden font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-hidden font-bold"
              />
            </div>
          </div>

          {/* Randomization toggles */}
          <div className="p-4 bg-slate-50 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm"
              />
              <span>Tự động đảo thứ tự câu hỏi giữa các học sinh</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm"
              />
              <span>Đảo ngẫu nhiên vị trí các đáp án A, B, C, D</span>
            </label>
          </div>
        </div>

        {/* Question Selector Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Chọn câu hỏi vào đề ({selectedQuestionIds.size} câu đã chọn)
              </h3>
              <p className="text-xs text-slate-500">
                Chọn câu hỏi có sẵn từ ngân hàng đề hoặc dùng AI để sinh câu hỏi mới tức thời
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateQuestionsAI}
              disabled={isAiLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiLoading ? 'AI đang sinh câu hỏi...' : 'AI sinh câu hỏi mới'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {availableQuestions.map((q, index) => {
              const isSelected = selectedQuestionIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleQuestion(q.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">Câu hỏi #{index + 1}</span>
                      <span className="text-[11px] text-blue-600 font-semibold">{q.points || 2} điểm</span>
                    </div>
                    <p className="text-slate-900 text-sm font-medium">{q.question_text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/quizzes')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            Tạo & Mở đề thi ngay
          </button>
        </div>
      </form>
    </div>
  );
};
