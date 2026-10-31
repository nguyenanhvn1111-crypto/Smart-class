import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { Quiz, Question } from '../../types';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Trophy,
  RotateCcw
} from 'lucide-react';

export const StudentQuizTaker: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    DataService.getQuizzes('cls-10a1').then((qzs) => {
      setQuizzes(qzs);
      if (qzs.length > 0 && !activeQuiz) {
        setActiveQuiz(qzs[0]);
        setTimeLeft(qzs[0].duration_minutes * 60);
      }
    });
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || isCompleted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, isCompleted]);

  const questions = activeQuiz?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSelectAnswer = (qId: string, answerId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: answerId
    }));
  };

  const handleSubmitExam = () => {
    // Auto-grade single choice questions
    let totalScore = 0;
    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns && studentAns === q.correct_answer) {
        totalScore += q.points || 2.0;
      }
    });

    setScore(totalScore);
    setIsCompleted(true);
    confetti({ particleCount: 100, spread: 70 });
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!activeQuiz) {
    return (
      <div className="text-center py-12 text-slate-400">
        Không có bài kiểm tra nào đang diễn ra.
      </div>
    );
  }

  // Completed results view
  if (isCompleted) {
    const totalPoints = questions.reduce((acc, q) => acc + (q.points || 2), 0);
    const isPassed = (score || 0) >= (activeQuiz.pass_score || 5);

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-4">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ring-8 ${
              isPassed ? 'bg-emerald-50 text-emerald-600 ring-emerald-50' : 'bg-amber-50 text-amber-600 ring-amber-50'
            }`}
          >
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">
            {isPassed ? 'Chúc mừng bạn đã hoàn thành bài thi!' : 'Bài thi đã kết thúc!'}
          </h2>
          <p className="text-sm text-slate-500">
            {activeQuiz.title} • {activeQuiz.subject_name}
          </p>

          <div className="p-6 bg-slate-50 rounded-2xl max-w-sm mx-auto">
            <span className="text-xs text-slate-400 uppercase font-semibold">Điểm số đạt được:</span>
            <span className="text-4xl font-black text-blue-600 block mt-1">
              {score} / {totalPoints}
            </span>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isPassed ? 'ĐẠT YÊU CẦU' : 'CẦN CỐ GẮNG THÊM'}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setIsCompleted(false);
                setAnswers({});
                setTimeLeft(activeQuiz.duration_minutes * 60);
                setCurrentQuestionIndex(0);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Làm lại bài thi thử
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Exam Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase text-purple-600 tracking-wider">
            {activeQuiz.subject_name}
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{activeQuiz.title}</h1>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl font-mono text-base font-bold shadow-2xs self-start sm:self-auto">
          <Clock className="w-5 h-5 text-amber-600" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area (3 cols) */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[440px]">
          {currentQ ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                  Câu hỏi {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{currentQ.points || 2} điểm</span>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQ.question_text}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options?.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài thi</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Question Navigation Palette (1 col) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Bảng câu hỏi ({Object.keys(answers).length}/{questions.length} đã làm)
          </h4>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn nộp bài sớm?')) {
                  handleSubmitExam();
                }
              }}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
            >
              Nộp bài thi ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
