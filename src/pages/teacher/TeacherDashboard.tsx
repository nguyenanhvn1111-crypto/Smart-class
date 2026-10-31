import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { DataService, store } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { ChartCard } from '../../components/common/ChartCard';
import { StatusChip } from '../../components/common/StatusChip';
import {
  Users,
  CalendarCheck,
  UserX,
  Clock,
  Calendar,
  AlertTriangle,
  FileCheck2,
  FileText,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Dices
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { classes, selectedClassId, setSelectedClassId } = useClass();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(false);
      const stus = await DataService.getStudents(selectedClassId);
      const asgs = await DataService.getAssignments(selectedClassId);
      const alts = await DataService.getAlerts(selectedClassId);
      const att = await DataService.getAttendanceSession(selectedClassId, '2026-10-04');
      setStudents(stus);
      setAssignments(asgs);
      setAlerts(alts);
      setTodayAttendance(att);
    };

    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, [selectedClassId]);

  // Attendance metrics
  const totalStudents = students.length || 24;
  const presentCount = todayAttendance?.present_count ?? 22;
  const absentCount = (todayAttendance?.absent_excused_count ?? 1) + (todayAttendance?.absent_unexcused_count ?? 0);
  const lateCount = todayAttendance?.late_count ?? 1;

  // Pending grading count
  const pendingGradingCount = assignments.reduce(
    (acc, curr) => acc + (curr.submitted_count - curr.graded_count),
    0
  );

  // Chart data: Attendance breakdown
  const attendancePieData = [
    { name: 'Có mặt', value: presentCount, color: '#10B981' },
    { name: 'Nghỉ học', value: absentCount, color: '#EF4444' },
    { name: 'Đi muộn', value: lateCount, color: '#F59E0B' }
  ];

  // Chart data: Grade distribution
  const gradeDistribution = [
    { range: '< 5 (Yếu)', count: 1 },
    { range: '5 - 6.5 (TB)', count: 4 },
    { range: '6.5 - 8 (Khá)', count: 10 },
    { range: '8 - 9 (Giỏi)', count: 7 },
    { range: '9 - 10 (XS)', count: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              Học kỳ 1 • Năm học 2025 - 2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {user?.full_name || 'Thầy/Cô'}! 👋
            </h1>
            <p className="mt-1 text-sm text-blue-100 max-w-xl">
              Hôm nay lớp <span className="font-semibold text-white">10A1</span> có 2 tiết Toán và 1 bài kiểm tra 15 phút. Sĩ số có mặt đạt 95.8%.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Điểm danh ngay</span>
            </button>
            <button
              onClick={() => navigate('/teacher/tools')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-xs sm:text-sm rounded-xl transition-all active:scale-95"
            >
              <Dices className="w-4 h-4" />
              <span>Công cụ lớp học</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng số học sinh"
          value={totalStudents}
          subtitle="Sĩ số lớp hiện tại"
          icon={Users}
          color="blue"
          onClick={() => navigate('/teacher/students')}
        />
        <StatCard
          title="Có mặt hôm nay"
          value={presentCount}
          subtitle={`${Math.round((presentCount / totalStudents) * 100)}% tỷ lệ chuyên cần`}
          icon={CalendarCheck}
          color="emerald"
          onClick={() => navigate('/teacher/attendance')}
          trend={{ value: '1.2%', isPositive: true }}
        />
        <StatCard
          title="Vắng / Đi trễ"
          value={`${absentCount} / ${lateCount}`}
          subtitle="Cần liên hệ phụ huynh"
          icon={UserX}
          color="rose"
          onClick={() => navigate('/teacher/attendance')}
        />
        <StatCard
          title="Bài chưa chấm"
          value={pendingGradingCount}
          subtitle="Từ các bài tập tuần"
          icon={FileCheck2}
          color="amber"
          onClick={() => navigate('/teacher/assignments')}
        />
      </div>

      {/* Main Grid: Urgent Tasks & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Action Needed & Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Needed Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Việc cần xử lý gấp</h3>
                  <p className="text-xs text-slate-400">Các cảnh báo và bài nộp cần được xử lý</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/teacher/alerts')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Xem tất cả ({alerts.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/teacher/alerts')}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-start justify-between cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-4 h-4 mt-0.5 ${
                        alert.severity === 'high' ? 'text-rose-500' : 'text-amber-500'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{alert.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <StatusChip status={alert.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900">Lịch dạy hôm nay (Thứ Hai)</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/schedule')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Thời khóa biểu tuần
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex justify-between items-center text-xs text-blue-700 font-semibold mb-1">
                  <span>Tiết 1 - 2 (07:30 - 09:05)</span>
                  <span className="bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-md text-[10px]">
                    Đang diễn ra
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Toán Học • Đại số</h4>
                <p className="text-xs text-slate-600 mt-1">Lớp 10A1 • Phòng 201</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-1">
                  <span>Tiết 3 (09:25 - 10:10)</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                    Sắp tới
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Toán Học • Luyện tập</h4>
                <p className="text-xs text-slate-600 mt-1">Lớp 10A2 • Phòng 202</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-1">
                  <span>Tiết 4 (10:15 - 11:00)</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                    Sắp tới
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Sinh hoạt chủ nhiệm</h4>
                <p className="text-xs text-slate-600 mt-1">Lớp 10A1 • Phòng 201</p>
              </div>
            </div>
          </div>

          {/* Analytics Chart: Grade distribution */}
          <ChartCard
            title="Phổ điểm kiểm tra môn Toán"
            subtitle="Thống kê kết quả đánh giá thường xuyên của lớp"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Số học sinh" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right column: Quick Class Overview & Today's Attendance breakdown */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Lối tắt thao tác</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/teacher/attendance')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all group"
              >
                <CalendarCheck className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 block">Điểm danh</span>
                <span className="text-[10px] text-slate-400">Ghi nhận sĩ số</span>
              </button>
              <button
                onClick={() => navigate('/teacher/assignments/create')}
                className="p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 text-left transition-all group"
              >
                <FileText className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 block">Giao bài tập</span>
                <span className="text-[10px] text-slate-400">Đính kèm tài liệu</span>
              </button>
              <button
                onClick={() => navigate('/teacher/grades')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition-all group"
              >
                <TrendingUp className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 block">Sổ điểm</span>
                <span className="text-[10px] text-slate-400">Nhập điểm nhanh</span>
              </button>
              <button
                onClick={() => navigate('/teacher/ai')}
                className="p-3 rounded-xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50/30 text-left transition-all group"
              >
                <Sparkles className="w-5 h-5 text-pink-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 block">Trợ lý AI</span>
                <span className="text-[10px] text-slate-400">Soạn đề & giáo án</span>
              </button>
            </div>
          </div>

          {/* Attendance Pie Chart */}
          <ChartCard
            title="Chuyên cần hôm nay"
            subtitle="Tỷ lệ học sinh hiện diện trong ngày"
          >
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Có mặt ({presentCount})
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Nghỉ ({absentCount})
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Muộn ({lateCount})
                </span>
              </div>
            </div>
          </ChartCard>

          {/* Classes Overview Mini List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Lớp đang phụ trách</h3>
              <button
                onClick={() => navigate('/teacher/classes')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Tất cả
              </button>
            </div>
            <div className="space-y-2.5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    navigate(`/teacher/classes/${cls.id}`);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    cls.id === selectedClassId
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{cls.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Sĩ số: {cls.student_count} • Mã: {cls.join_code}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
