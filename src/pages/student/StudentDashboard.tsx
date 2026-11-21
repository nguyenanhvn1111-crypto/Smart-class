import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { Assignment, Quiz, Announcement } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { DailyNatureBanner } from '../../components/common/DailyNatureBanner';
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
      {/* Student Welcome Banner with Daily Nature Scenery */}
      <DailyNatureBanner
        roleMeta="Học sinh Lớp 10A1 · Mã số: HS10001"
        title={`Chào ${user?.full_name || 'Lê Hoàng Long'}!`}
        description="Hôm nay bạn có 2 bài tập cần nộp và 1 bài kiểm tra 15 phút môn Toán. Hãy chuẩn bị thật tốt nhé!"
        actions={
          <button
            onClick={() => navigate('/student/assignments')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Làm bài tập ngay</span>
          </button>
        }
      />

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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bài tập cần làm</h3>
              </div>
              <button
                onClick={() => navigate('/student/assignments')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                Xem tất cả ({assignments.length})
              </button>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => navigate('/student/assignments')}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                        {asg.subject_name}
                      </span>
                      <span className="text-xs text-slate-400">Thang điểm: {asg.points_max}đ</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{asg.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bài kiểm tra & Quiz trực tuyến</h3>
              </div>
              <button
                onClick={() => navigate('/student/quizzes')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700"
              >
                Vào làm bài
              </button>
            </div>

            <div className="space-y-3">
              {quizzes.map((qz) => (
                <div
                  key={qz.id}
                  className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/30 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{qz.subject_name}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{qz.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Thông báo từ nhà trường</h3>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((anc) => (
                <div key={anc.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
                    {anc.author_name}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{anc.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{anc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
