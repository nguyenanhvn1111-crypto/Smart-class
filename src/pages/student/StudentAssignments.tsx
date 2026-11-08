import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { Assignment, Submission, AssignmentQuestionItem } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Send,
  HelpCircle,
  Award,
  ChevronRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Paperclip
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  // Current student identity (defaults to 'stu-001' Lê Hoàng Long if generic student account)
  const currentStudentId = user?.id === 'usr-s1' || user?.role === 'student' ? 'stu-001' : 'stu-001';
  const currentStudentName = user?.full_name || 'Lê Hoàng Long';
  const currentStudentCode = 'HS10001';

  // Exactly 3 tabs required for Student role:
  // Tab 1: 'all' ("Tất cả bài tập")
  // Tab 2: 'completed' ("Bài tập đã làm")
  // Tab 3: 'work' ("Làm bài")
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'work'>('all');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Selected assignment for Tab 3: "Làm bài"
  const [selectedAsgIdForWork, setSelectedAsgIdForWork] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [essayContent, setEssayContent] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Review completed submission modal
  const [reviewSub, setReviewSub] = useState<Submission | null>(null);
  const [reviewAsg, setReviewAsg] = useState<Assignment | null>(null);

  const loadData = async () => {
    const asgs = await DataService.getAssignments();
    const subs = await DataService.getSubmissions();
    setAssignments(asgs);
    setSubmissions(subs);

    // If no work assignment selected, default to first uncompleted assignment
    if (!selectedAsgIdForWork && asgs.length > 0) {
      const mySubAsgIds = new Set(
        subs.filter((s) => s.student_id === currentStudentId).map((s) => s.assignment_id)
      );
      const uncompleted = asgs.find((a) => !mySubAsgIds.has(a.id));
      setSelectedAsgIdForWork(uncompleted ? uncompleted.id : asgs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Map of student's own submissions
  const mySubmissionsMap = new Map<string, Submission>();
  submissions
    .filter((s) => s.student_id === currentStudentId)
    .forEach((s) => {
      mySubmissionsMap.set(s.assignment_id, s);
    });

  // Calculate statistics for Tab 2: "học sinh có thể thấy mình đã làm bao nhiêu bài và còn lại mấy bài"
  const totalAssignmentsCount = assignments.length;
  const completedAssignmentsList = assignments.filter((a) => mySubmissionsMap.has(a.id));
  const completedCount = completedAssignmentsList.length;
  const remainingCount = Math.max(0, totalAssignmentsCount - completedCount);
  const completionPercentage =
    totalAssignmentsCount > 0 ? Math.round((completedCount / totalAssignmentsCount) * 100) : 0;

  // Active assignment being worked on in Tab 3
  const activeWorkingAsg = assignments.find((a) => a.id === selectedAsgIdForWork) || assignments[0];
  const activeWorkingSub = activeWorkingAsg ? mySubmissionsMap.get(activeWorkingAsg.id) : undefined;

  // Handle switching to Tab 3 "Làm bài" with a specific assignment
  const handleStartWorking = (asgId: string) => {
    setSelectedAsgIdForWork(asgId);
    setAnswers({});
    setEssayContent('');
    setAttachedFileName('');
    setActiveTab('work');
  };

  // Handle viewing a finished assignment's results
  const handleReviewSubmission = (asg: Assignment, sub: Submission) => {
    setReviewAsg(asg);
    setReviewSub(sub);
  };

  // Submit Homework in Tab 3
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkingAsg) return;

    setIsSubmitting(true);

    try {
      await DataService.submitAssignment({
        assignment_id: activeWorkingAsg.id,
        student_id: currentStudentId,
        student_name: currentStudentName,
        student_code: currentStudentCode,
        content: essayContent || 'Bài làm trắc nghiệm trực tuyến',
        files: attachedFileName
          ? [{ name: attachedFileName, url: '#', size: '1.8 MB' }]
          : [{ name: `Bai_lam_${activeWorkingAsg.title.slice(0, 20)}.pdf`, url: '#', size: '1.2 MB' }],
        answers: answers
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('completed');
      }, 1800);

      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              VAI TRÒ HỌC SINH
            </span>
            <span className="text-xs text-slate-500 font-medium">Học sinh: {currentStudentName} ({currentStudentCode})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Nhiệm vụ & Bài tập về nhà
          </h1>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-semibold self-start sm:self-auto">
          <span className="text-slate-500">Tiến độ bài tập:</span>
          <span className="text-emerald-700 font-extrabold">{completedCount} đã làm</span>
          <span className="text-slate-300">/</span>
          <span className="text-rose-600 font-bold">{remainingCount} còn lại</span>
        </div>
      </div>

      {/* EXACTLY 3 TABS FOR STUDENT ROLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 flex gap-2">
        {/* Tab 1: "Tất cả bài tập" */}
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tất cả bài tập</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {assignments.length}
          </span>
        </button>

        {/* Tab 2: "Bài tập đã làm" */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Bài tập đã làm</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {completedCount} bài
          </span>
        </button>

        {/* Tab 3: "Làm bài" */}
        <button
          onClick={() => setActiveTab('work')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'work'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Làm bài</span>
          {remainingCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                activeTab === 'work' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              Còn {remainingCount}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: TẤT CẢ BÀI TẬP ================= */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-semibold">
              Ký hiệu trạng thái: <b className="text-emerald-700">🟢 Đã làm</b> (Đã hoàn thành và nộp bài) • <b className="text-rose-600">🔴 Chưa làm</b> (Cần nộp trước thời hạn)
            </span>
            <span className="text-slate-400 font-medium">Hiện có {assignments.length} bài tập được giao</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => {
              const mySub = mySubmissionsMap.get(asg.id);
              const isCompleted = !!mySub;
              const isPastDue = new Date(asg.due_date) < new Date();

              return (
                <div
                  key={asg.id}
                  className={`bg-white rounded-3xl border p-5 shadow-2xs space-y-4 transition-all hover:shadow-md flex flex-col justify-between ${
                    isCompleted ? 'border-emerald-200/90' : 'border-slate-200/90'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Class clearly highlighted + Status emote */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Hiện rõ bài tập lớp nào */}
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                          {asg.class_name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {asg.subject_name}
                        </span>
                      </div>

                      {/* Emote tròn xanh lá nếu đã làm, tròn đỏ nếu chưa làm */}
                      {isCompleted ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold">
                          <span className="text-sm">🟢</span>
                          <span>Đã làm</span>
                          {mySub.score !== undefined && (
                            <span className="ml-1 bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-black">
                              {mySub.score}đ
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-extrabold animate-pulse">
                          <span className="text-sm">🔴</span>
                          <span>Chưa làm</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Teacher */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {asg.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {asg.description}
                      </p>
                    </div>

                    {/* Due Date & Info */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      {/* Hiện thời hạn nộp */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Thời hạn nộp:
                        </span>
                        <span className={`font-bold ${isPastDue && !isCompleted ? 'text-rose-600' : 'text-slate-800'}`}>
                          {new Date(asg.due_date).toLocaleDateString('vi-VN')} lúc {new Date(asg.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Giáo viên:</span>
                        <span className="font-semibold text-slate-700">{asg.teacher_name || 'Cô Trần Thị Mai'}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Số lượng câu hỏi:</span>
                        <span className="font-bold text-slate-800">{asg.total_questions || asg.questions?.length || 5} câu ({asg.points_max}đ)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-3 border-t border-slate-100">
                    {isCompleted ? (
                      <button
                        onClick={() => handleReviewSubmission(asg, mySub)}
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Xem lại bài làm & Nhận xét của GV</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartWorking(asg.id)}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        <span>Làm bài ngay</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: BÀI TẬP ĐÃ LÀM ================= */}
      {activeTab === 'completed' && (
        <div className="space-y-6">
          {/* Summary KPI Cards: Học sinh thấy rõ mình đã làm bao nhiêu bài và còn lại mấy bài */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Số bài đã làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950">{completedCount}</span>
                <span className="text-xs font-bold text-emerald-700">bài tập hoàn thành</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">Đã nộp bài đầy đủ lên hệ thống</p>
            </div>

            <div className="bg-rose-50 border border-rose-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Còn lại mấy bài chưa làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-950">{remainingCount}</span>
                <span className="text-xs font-bold text-rose-700">bài cần nộp</span>
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                {remainingCount > 0 ? 'Hãy chuyển sang tab "Làm bài" để hoàn thành' : 'Xuất sắc! Đã làm hết tất cả bài tập'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                Tỉ lệ hoàn thành
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-950">{completionPercentage}%</span>
                <span className="text-xs font-bold text-blue-700">tổng số ({totalAssignmentsCount} bài)</span>
              </div>
              <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* List of completed assignments */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Danh sách bài tập bạn đã nộp ({completedCount} bài)</span>
              </h3>
              {remainingCount > 0 && (
                <button
                  onClick={() => setActiveTab('work')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Làm tiếp {remainingCount} bài còn lại</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {completedCount > 0 ? (
              <div className="divide-y divide-slate-100">
                {completedAssignmentsList.map((asg) => {
                  const sub = mySubmissionsMap.get(asg.id)!;
                  return (
                    <div key={asg.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                            {asg.class_name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {asg.subject_name}
                          </span>
                          <span className="text-xs text-slate-400">
                            Nộp lúc: {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {sub.score !== undefined ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            <span>Điểm: {sub.score} / 10đ</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                            Đã nộp • Chờ chấm điểm
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{asg.title}</h4>
                        {sub.feedback && (
                          <div className="mt-2 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900">
                            <span className="font-bold block mb-0.5">Lời nhận xét của thầy cô:</span>
                            <span>{sub.feedback}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500">
                          {sub.correct_count !== undefined && (
                            <b>Đúng {sub.correct_count}/{asg.total_questions || 5} câu trắc nghiệm • </b>
                          )}
                          Tệp nộp: {sub.files?.[0]?.name || 'Bai_lam.pdf'}
                        </span>

                        <button
                          onClick={() => handleReviewSubmission(asg, sub)}
                          className="font-bold text-blue-600 hover:text-blue-800"
                        >
                          Xem chi tiết bài nộp &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 text-xs">
                Bạn chưa hoàn thành bài tập nào. Hãy chuyển sang tab <b>"Làm bài"</b> để bắt đầu nhé!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: LÀM BÀI ================= */}
      {activeTab === 'work' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Tab 3 / Khu vực làm bài & nộp bài
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Làm bài và nộp bài trực tuyến
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Chọn bài tập cần hoàn thành, trả lời câu hỏi và bấm nộp bài để thầy cô chấm điểm.
              </p>
            </div>

            {/* Assignment Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-600">Chọn bài tập:</span>
              <select
                value={selectedAsgIdForWork}
                onChange={(e) => {
                  setSelectedAsgIdForWork(e.target.value);
                  setAnswers({});
                  setEssayContent('');
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
              >
                {assignments.map((a) => {
                  const done = mySubmissionsMap.has(a.id);
                  return (
                    <option key={a.id} value={a.id}>
                      {done ? '🟢 (Đã nộp) ' : '🔴 (Chưa nộp) '} {a.title}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Nộp bài thành công! Bài tập đã chuyển sang trạng thái 🟢 Đã làm. Đang chuyển về tab "Bài tập đã làm"...</span>
            </div>
          )}

          {activeWorkingAsg && (
            <form onSubmit={handleSubmitAssignment} className="space-y-6">
              {/* Assignment Information Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800">
                      {activeWorkingAsg.class_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                      {activeWorkingAsg.subject_name}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hạn nộp:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(activeWorkingAsg.due_date).toLocaleDateString('vi-VN')} {new Date(activeWorkingAsg.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {activeWorkingAsg.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeWorkingAsg.description}
                </p>

                {activeWorkingSub && (
                  <div className="mt-2 p-3 bg-emerald-100/60 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <span className="text-sm">🟢</span>
                    <span>Bạn đã nộp bài này vào lúc {new Date(activeWorkingSub.submitted_at).toLocaleString('vi-VN')}. Nộp lại sẽ cập nhật bài mới.</span>
                  </div>
                )}
              </div>

              {/* Questions Section */}
              {activeWorkingAsg.questions && activeWorkingAsg.questions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Phần câu hỏi trắc nghiệm ({activeWorkingAsg.questions.length} câu)</span>
                  </h4>

                  <div className="space-y-4">
                    {activeWorkingAsg.questions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            Câu {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {q.question_text}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options?.map((opt, oIdx) => {
                            const optKey = ['A', 'B', 'C', 'D'][oIdx] || opt.charAt(0);
                            const isSelected = answers[q.id] === optKey;

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setAnswers({ ...answers, [q.id]: optKey })}
                                className={`text-left p-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay / Written response */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Bài làm tự luận / Lời giải chi tiết / Ghi chú cho giáo viên
                </label>
                <textarea
                  rows={4}
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                  placeholder="Nhập câu trả lời chi tiết hoặc các bước giải của bạn vào đây..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* File Attachment Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-700 block">
                  Đính kèm bài làm (Ảnh chụp bài làm, file Word, PDF)
                </span>
                <input
                  type="file"
                  id="fileUploadStudent"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFileName(e.target.files[0].name);
                    }
                  }}
                />
                <label
                  htmlFor="fileUploadStudent"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>{attachedFileName ? `Đã chọn: ${attachedFileName}` : 'Chọn tệp đính kèm'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang nộp bài...' : 'Nộp bài tập'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewSub && reviewAsg && (
        <Modal
          isOpen={true}
          onClose={() => {
            setReviewSub(null);
            setReviewAsg(null);
          }}
          title={`Chi tiết bài làm: ${reviewAsg.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp & Môn:</span>
                <span className="font-bold text-slate-800">{reviewAsg.class_name} • {reviewAsg.subject_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian nộp:</span>
                <span className="font-semibold text-slate-700">{new Date(reviewSub.submitted_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kết quả đánh giá:</span>
                <span className="font-black text-blue-700 text-sm">
                  {reviewSub.score !== undefined ? `${reviewSub.score} / 10đ` : 'Chờ chấm điểm'}
                </span>
              </div>
            </div>

            {reviewSub.feedback && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
                <span className="font-extrabold block mb-1">Lời nhận xét từ giáo viên:</span>
                <p className="leading-relaxed">{reviewSub.feedback}</p>
              </div>
            )}

            {reviewSub.content && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Nội dung bài làm của bạn:</span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap">
                  {reviewSub.content}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setReviewSub(null);
                  setReviewAsg(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
