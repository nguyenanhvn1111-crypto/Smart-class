import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { Assignment, Submission, Student } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  PieChart as PieIcon,
  HelpCircle,
  BellRing,
  BookOpen,
  ChevronRight,
  TrendingUp,
  XCircle,
  MinusCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface ChildOption {
  id: string;
  name: string;
  class: string;
  code: string;
  avatar: string;
}

const CHILDREN_LIST: ChildOption[] = [
  {
    id: 'stu-001',
    name: 'Lê Hoàng Long',
    class: '10A1 - Chuyên Toán',
    code: 'HS10001',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'
  },
  {
    id: 'stu-003',
    name: 'Lê Minh Anh',
    class: '10A1 - Chuyên Toán',
    code: 'HS10003',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
  }
];

export const ParentAssignments: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState<string>('stu-001');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  // Modal to view details of submitted assignment
  const [viewSub, setViewSub] = useState<Submission | null>(null);
  const [viewAsg, setViewAsg] = useState<Assignment | null>(null);

  // Exactly 3 tabs required for Parent role:
  // Tab 1: 'completed' ("Bài tập [Tên con] đã làm")
  // Tab 2: 'uncompleted' ("Bài tập chưa làm")
  // Tab 3: 'accuracy' ("Tỉ lệ câu hỏi đúng")
  const [activeTab, setActiveTab] = useState<'completed' | 'uncompleted' | 'accuracy'>('completed');

  const activeChild = CHILDREN_LIST.find((c) => c.id === selectedChildId) || CHILDREN_LIST[0];

  const loadData = async () => {
    const asgs = await DataService.getAssignments();
    const subs = await DataService.getSubmissions();
    setAssignments(asgs);
    setSubmissions(subs);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Child submissions mapping
  const childSubmissionsMap = new Map<string, Submission>();
  submissions
    .filter((s) => s.student_id === activeChild.id)
    .forEach((s) => {
      childSubmissionsMap.set(s.assignment_id, s);
    });

  // Completed assignments vs uncompleted assignments
  const completedAssignments = assignments.filter((a) => childSubmissionsMap.has(a.id));
  const uncompletedAssignments = assignments.filter((a) => !childSubmissionsMap.has(a.id));

  const completedCount = completedAssignments.length;
  const uncompletedCount = uncompletedAssignments.length;
  const totalCount = assignments.length;

  // Question-level statistics calculation across all assignments:
  // Con đã làm bao nhiêu câu/bài và còn lại bao nhiêu câu chưa làm và số bài chưa làm
  let totalQuestionsCount = 0;
  let questionsCompletedCount = 0;
  let questionsRemainingCount = 0;
  let questionsCorrectCount = 0;
  let questionsWrongCount = 0;

  // Breakdown by subject
  const subjectStats: Record<
    string,
    { total: number; correct: number; wrong: number; unanswered: number }
  > = {};

  assignments.forEach((asg) => {
    const qCount = asg.total_questions || asg.questions?.length || 5;
    totalQuestionsCount += qCount;

    if (!subjectStats[asg.subject_name]) {
      subjectStats[asg.subject_name] = { total: 0, correct: 0, wrong: 0, unanswered: 0 };
    }
    subjectStats[asg.subject_name].total += qCount;

    const sub = childSubmissionsMap.get(asg.id);
    if (sub) {
      questionsCompletedCount += qCount;
      const c = sub.correct_count ?? (sub.score !== undefined ? Math.round((sub.score / 10) * qCount) : qCount);
      const w = sub.wrong_count ?? Math.max(0, qCount - c);
      questionsCorrectCount += c;
      questionsWrongCount += w;

      subjectStats[asg.subject_name].correct += c;
      subjectStats[asg.subject_name].wrong += w;
    } else {
      questionsRemainingCount += qCount;
      subjectStats[asg.subject_name].unanswered += qCount;
    }
  });

  // Calculate percentages for the circular chart
  const correctPct =
    totalQuestionsCount > 0 ? Math.round((questionsCorrectCount / totalQuestionsCount) * 100) : 0;
  const wrongPct =
    totalQuestionsCount > 0 ? Math.round((questionsWrongCount / totalQuestionsCount) * 100) : 0;
  const remainingPct = Math.max(0, 100 - correctPct - wrongPct);

  // Data for Donut Chart
  const chartData = [
    { name: 'Số câu làm đúng', value: questionsCorrectCount, color: '#10b981', pct: correctPct }, // Green
    { name: 'Số câu làm sai', value: questionsWrongCount, color: '#f43f5e', pct: wrongPct }, // Red
    { name: 'Số câu chưa làm', value: questionsRemainingCount, color: '#f59e0b', pct: remainingPct } // Yellow / Amber
  ];

  const handleRemindChild = (asgTitle: string) => {
    setReminderNote(`Đã gửi lời nhắc học tập đến ${activeChild.name} cho bài: "${asgTitle}"!`);
    setTimeout(() => setReminderNote(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Child Switcher */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                VAI TRÒ PHỤ HUYNH
              </span>
              <span className="text-xs text-purple-200">Giám sát & Đồng hành học tập</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Bài tập & Tiến độ học tập của con
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-purple-100 max-w-xl">
              Theo dõi chi tiết các bài tập con đã nộp, bài còn chưa làm và tỉ lệ trả lời đúng câu hỏi.
            </p>
          </div>

          {/* Child Switcher Component */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 self-start md:self-auto">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider px-2 block mb-1">
              Chọn con để xem bài tập:
            </span>
            <div className="flex gap-2">
              {CHILDREN_LIST.map((child) => {
                const isSelected = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-purple-950 shadow-md font-extrabold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{child.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {reminderNote && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reminderNote}</span>
        </div>
      )}

      {/* EXACTLY 3 TABS FOR PARENT ROLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 flex gap-2">
        {/* Tab 1: "Bài tập [Tên con] đã làm" */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Bài tập {activeChild.name} đã làm</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {completedCount} bài
          </span>
        </button>

        {/* Tab 2: "Bài tập chưa làm" */}
        <button
          onClick={() => setActiveTab('uncompleted')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'uncompleted'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Bài tập chưa làm</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === 'uncompleted' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {uncompletedCount} bài
          </span>
        </button>

        {/* Tab 3: "Tỉ lệ câu hỏi đúng" */}
        <button
          onClick={() => setActiveTab('accuracy')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'accuracy'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>Tỉ lệ câu hỏi đúng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === 'accuracy' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {correctPct}% đúng
          </span>
        </button>
      </div>

      {/* ================= TAB 1: BÀI TẬP [TÊN CON] ĐÃ LÀM ================= */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">
              Danh sách các bài tập con <b className="text-slate-900">{activeChild.name}</b> đã hoàn thành và nộp cho giáo viên
            </span>
            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Đã nộp: {completedCount} / {totalCount} bài tập
            </span>
          </div>

          {completedAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedAssignments.map((asg) => {
                const sub = childSubmissionsMap.get(asg.id)!;
                return (
                  <div
                    key={asg.id}
                    className="bg-white rounded-3xl border border-emerald-200/90 shadow-2xs p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100 text-blue-800">
                            {asg.class_name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                            {asg.subject_name}
                          </span>
                        </div>

                        {sub.score !== undefined ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200">
                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Điểm: {sub.score} / 10đ</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl border border-amber-200">
                            Đã nộp bài
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {asg.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Giáo viên phụ trách:</span>
                          <span className="font-semibold text-slate-800">{asg.teacher_name || 'Cô Trần Thị Mai'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời gian con nộp bài:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {sub.correct_count !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Số câu trả lời đúng:</span>
                            <span className="font-black text-emerald-700">
                              {sub.correct_count} / {asg.total_questions || 5} câu
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Teacher's evaluation / feedback */}
                      {sub.feedback && (
                        <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                          <span className="font-extrabold block text-blue-800">Nhận xét của giáo viên:</span>
                          <p className="leading-relaxed">{sub.feedback}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setViewAsg(asg);
                        setViewSub(sub);
                      }}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Xem chi tiết bài làm của con</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 text-xs">
              Con chưa hoàn thành bài tập nào. Hãy nhắc con vào tab "Bài tập chưa làm" để nộp bài nhé!
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: BÀI TẬP CHƯA LÀM ================= */}
      {activeTab === 'uncompleted' && (
        <div className="space-y-6">
          {/* Detailed Statistics: Con đã làm bao nhiêu câu/bài và còn lại bao nhiêu câu chưa làm và số bài chưa làm */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Số bài chưa làm */}
            <div className="bg-rose-50 border border-rose-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Số bài chưa làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-950">{uncompletedCount}</span>
                <span className="text-xs font-bold text-rose-700">bài tập</span>
              </div>
              <p className="text-[11px] text-rose-600 mt-1">Cần con làm và nộp trước hạn</p>
            </div>

            {/* 2. Số câu chưa làm */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-amber-600" />
                Số câu chưa làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-950">{questionsRemainingCount}</span>
                <span className="text-xs font-bold text-amber-700">câu hỏi</span>
              </div>
              <p className="text-[11px] text-amber-600 mt-1">Chưa hoàn thành trong đề bài</p>
            </div>

            {/* 3. Số bài con đã làm */}
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Số bài con đã làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950">{completedCount}</span>
                <span className="text-xs font-bold text-emerald-700">bài tập</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">Đã được giáo viên tiếp nhận</p>
            </div>

            {/* 4. Số câu hỏi con đã làm */}
            <div className="bg-blue-50 border border-blue-200/90 rounded-3xl p-5">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Số câu hỏi đã làm
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-950">{questionsCompletedCount}</span>
                <span className="text-xs font-bold text-blue-700">/ {totalQuestionsCount} câu</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">
                Chiếm {totalQuestionsCount > 0 ? Math.round((questionsCompletedCount / totalQuestionsCount) * 100) : 0}% tổng câu hỏi
              </p>
            </div>
          </div>

          {/* List of Pending Assignments */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Danh sách bài tập cần hoàn thành ({uncompletedCount} bài)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phụ huynh có thể bấm nút "Nhắc nhở con" để gửi lời nhắn nhắc con ngồi vào bàn học.
                </p>
              </div>
            </div>

            {uncompletedAssignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {uncompletedAssignments.map((asg) => {
                  const isPastDue = new Date(asg.due_date) < new Date();
                  const qCount = asg.total_questions || asg.questions?.length || 5;

                  return (
                    <div key={asg.id} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                            {asg.class_name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {asg.subject_name}
                          </span>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            🔴 Chưa nộp ({qCount} câu hỏi)
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{asg.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{asg.description}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            Thời hạn: {new Date(asg.due_date).toLocaleDateString('vi-VN')} {new Date(asg.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>Giáo viên: {asg.teacher_name || 'Cô Trần Thị Mai'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemindChild(asg.title)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all self-start sm:self-auto shrink-0 active:scale-95 shadow-2xs"
                      >
                        <BellRing className="w-3.5 h-3.5 text-amber-600" />
                        <span>Nhắc nhở con</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 text-xs">
                Tuyệt vời! Con <b>{activeChild.name}</b> đã hoàn thành toàn bộ bài tập được giao.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TỈ LỆ CÂU HỎI ĐÚNG ================= */}
      {activeTab === 'accuracy' && (
        <div className="space-y-6">
          {/* Main Card with Circular Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Tab 3 / Phân tích kết quả làm câu hỏi
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Vòng tròn tỉ lệ câu hỏi đúng, làm sai, chưa làm
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tổng hợp toàn bộ câu hỏi trắc nghiệm & bài tập của con <b>{activeChild.name}</b> trên hệ thống.
              </p>
            </div>

            {/* Circular Chart & Detail Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
              {/* VÒNG TRÒN HIỆN SỐ PHẦN TRĂM (Donut Chart) */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-3xl border border-slate-200">
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={115}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} câu (${item.payload.pct}%)`,
                          item.payload.name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Label inside donut circle */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900">{correctPct}%</span>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Làm đúng
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {questionsCorrectCount}/{totalQuestionsCount} câu
                    </span>
                  </div>
                </div>

                <div className="text-center mt-2">
                  <span className="text-xs font-bold text-slate-700">
                    Biểu đồ tỉ lệ toàn bộ câu hỏi được giao
                  </span>
                </div>
              </div>

              {/* Statistical Breakdown Legend */}
              <div className="lg:col-span-6 space-y-4">
                {/* 1. Số câu làm đúng */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black">
                      🟢
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Số câu làm đúng</span>
                      <span className="text-xs text-emerald-700">
                        {questionsCorrectCount} câu hỏi chuẩn xác
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-800">{correctPct}%</span>
                    <span className="text-[11px] text-emerald-600 font-bold block">tỉ lệ đúng</span>
                  </div>
                </div>

                {/* 2. Số câu làm sai */}
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
                      🔴
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-950 block">Số câu làm sai</span>
                      <span className="text-xs text-rose-700">
                        {questionsWrongCount} câu cần ôn tập lại
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-800">{wrongPct}%</span>
                    <span className="text-[11px] text-rose-600 font-bold block">cần cải thiện</span>
                  </div>
                </div>

                {/* 3. Số câu chưa làm */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                      🟡
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">Số câu chưa làm</span>
                      <span className="text-xs text-amber-700">
                        {questionsRemainingCount} câu trong bài chưa nộp
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-800">{remainingPct}%</span>
                    <span className="text-[11px] text-amber-600 font-bold block">chờ làm bài</span>
                  </div>
                </div>

                {/* Tổng số */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Tổng số câu hỏi được giao:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{totalQuestionsCount} câu hỏi</span>
                </div>
              </div>
            </div>

            {/* Breakdown by subject */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Chi tiết tỉ lệ câu hỏi theo từng môn học</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(subjectStats).map(([subj, stats]) => {
                  const sCorrectPct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                  return (
                    <div key={subj} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{subj}</span>
                        <span className="font-black text-blue-700">{sCorrectPct}% đúng</span>
                      </div>

                      {/* Mini bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
                        <div className="bg-rose-500 h-full" style={{ width: `${(stats.wrong / stats.total) * 100}%` }} />
                        <div className="bg-amber-400 h-full" style={{ width: `${(stats.unanswered / stats.total) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="text-emerald-700 font-bold">{stats.correct} đúng</span>
                        <span className="text-rose-600 font-bold">{stats.wrong} sai</span>
                        <span className="text-amber-600 font-bold">{stats.unanswered} chưa làm</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal for Parent */}
      {viewSub && viewAsg && (
        <Modal
          isOpen={true}
          onClose={() => {
            setViewSub(null);
            setViewAsg(null);
          }}
          title={`Bài làm của ${activeChild.name}: ${viewAsg.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Môn học & Lớp:</span>
                <span className="font-bold text-slate-800">{viewAsg.subject_name} • {viewAsg.class_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian con nộp bài:</span>
                <span className="font-semibold text-slate-700">{new Date(viewSub.submitted_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm số đạt được:</span>
                <span className="font-black text-blue-700 text-sm">
                  {viewSub.score !== undefined ? `${viewSub.score} / 10đ` : 'Chờ giáo viên chấm'}
                </span>
              </div>
              {viewSub.correct_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Câu hỏi trắc nghiệm đúng:</span>
                  <span className="font-extrabold text-emerald-700">
                    {viewSub.correct_count} / {viewAsg.total_questions || 5} câu
                  </span>
                </div>
              )}
            </div>

            {viewSub.feedback && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
                <span className="font-extrabold block mb-1">Lời nhận xét & đánh giá của giáo viên:</span>
                <p className="leading-relaxed">{viewSub.feedback}</p>
              </div>
            )}

            {viewSub.content && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Nội dung bài làm của con:</span>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap">
                  {viewSub.content}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setViewSub(null);
                  setViewAsg(null);
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
