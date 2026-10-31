import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { Assignment, Quiz, Announcement } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import {
  CalendarDays,
  FileText,
  HelpCircle,
  Award,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    DataService.getAssignments('cls-10a1').then(setAssignments);
    DataService.getQuizzes('cls-10a1').then(setQuizzes);
    DataService.getAnnouncements().then(setAnnouncements);
  }, []);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              Học sinh Lớp 10A1 • Mã số: HS10001
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào {user?.full_name || 'Lê Hoàng Long'}! 🚀
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-xl">
              Hôm nay bạn có 2 bài tập cần nộp và 1 bài kiểm tra 15 phút môn Toán. Hãy chuẩn bị thật tốt nhé!
            </p>
          </div>

          <button
            onClick={() => navigate('/student/assignments')}
            className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md self-start md:self-auto"
          >
            Làm bài tập ngay
          </button>
        </div>
      </div>

      {/* Student KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Điểm TB học kỳ"
          value="8.8"
          subtitle="Học lực: Giỏi"
          icon={TrendingUp}
          color="emerald"
          onClick={() => navigate('/student/grades')}
        />
        <StatCard
          title="Chuyên cần"
          value="98%"
          subtitle="Đi học đầy đủ"
          icon={CalendarCheck}
          color="blue"
          onClick={() => navigate('/student/attendance')}
        />
        <StatCard
          title="Bài tập cần nộp"
          value={assignments.length}
          subtitle="2 bài sắp đến hạn"
          icon={FileText}
          color="amber"
          onClick={() => navigate('/student/assignments')}
        />
        <StatCard
          title="Huy hiệu & Điểm rèn luyện"
          value="96đ"
          subtitle="3 huy hiệu danh dự"
          icon={Award}
          color="purple"
          onClick={() => navigate('/student/rewards')}
        />
      </div>

      {/* Grid: Pending assignments & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Tasks */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Bài tập cần làm</h3>
              </div>
              <button
                onClick={() => navigate('/student/assignments')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Xem tất cả ({assignments.length})
              </button>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => navigate('/student/assignments')}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                        {asg.subject_name}
                      </span>
                      <span className="text-xs text-slate-400">Thang điểm: {asg.points_max}đ</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{asg.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Hạn nộp: {new Date(asg.due_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <button className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs self-start sm:self-auto">
                    Nộp bài
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Online Quizzes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Bài kiểm tra & Quiz trực tuyến</h3>
              </div>
              <button
                onClick={() => navigate('/student/quizzes')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                Vào làm bài
              </button>
            </div>

            <div className="space-y-3">
              {quizzes.map((qz) => (
                <div
                  key={qz.id}
                  className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-purple-700">{qz.subject_name}</span>
                    <h4 className="font-bold text-sm text-slate-900">{qz.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thời gian: {qz.duration_minutes} phút • {qz.questions?.length || 5} câu hỏi
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/student/quizzes')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Bắt đầu thi
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Announcements & Recent Feedback */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Thông báo từ nhà trường</h3>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((anc) => (
                <div key={anc.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-blue-600 block mb-1">
                    {anc.author_name}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800">{anc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{anc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
