import React from 'react';
import { Award, Trophy, Star, Medal, Zap, Heart } from 'lucide-react';

export const StudentRewards: React.FC = () => {
  const badges = [
    {
      title: 'Ngôi sao giải Toán',
      desc: 'Đạt điểm 10 trong bài kiểm tra khảo sát và giải bài toán khó',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      date: '30/09/2026',
      points: '+25đ'
    },
    {
      title: 'Chăm chỉ chuyên cần',
      desc: 'Đi học đúng giờ và hiện diện 100% các tiết học trong tháng 9',
      icon: Star,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      date: '28/09/2026',
      points: '+15đ'
    },
    {
      title: 'Đôi bạn cùng tiến',
      desc: 'Tích cực hỗ trợ bạn cùng bàn trong các tiết thảo luận nhóm',
      icon: Heart,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      date: '25/09/2026',
      points: '+10đ'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Thành tích & Huy hiệu Vinh danh
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Bảng vinh danh huy hiệu rèn luyện, điểm thi đua và khen thưởng từ giáo viên bộ môn
        </p>
      </div>

      <div className="bg-linear-to-r from-amber-500 to-orange-500 p-8 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Hạng #1 Lớp 10A1
          </span>
          <h2 className="text-3xl font-black mt-2">Tổng điểm rèn luyện: 96 Điểm</h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Đạt danh hiệu "Học sinh tiêu biểu của tháng" do tập thể lớp bình chọn!
          </p>
        </div>
        <Trophy className="w-20 h-20 text-white/80 shrink-0 self-center" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div
              key={i}
              className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between ${b.color}`}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xs mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{b.desc}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ngày trao: {b.date}</span>
                <span className="font-extrabold text-sm">{b.points}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
