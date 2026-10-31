import React from 'react';
import { CalendarCheck, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const history = [
    { date: '2026-10-04', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' },
    { date: '2026-10-03', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' },
    { date: '2026-10-02', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' },
    { date: '2026-10-01', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' },
    { date: '2026-09-30', status: 'late', label: 'Đi muộn 10 phút (kẹt xe)', session: 'Buổi sáng' },
    { date: '2026-09-29', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' },
    { date: '2026-09-28', status: 'present', label: 'Có mặt đúng giờ', session: 'Buổi sáng' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Chuyên cần & Điểm danh của tôi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theo dõi lịch sử hiện diện và giờ giấc đến lớp được ghi nhận bởi thầy cô giáo
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl">
          <span className="text-xs font-semibold text-emerald-700 block">Tỷ lệ chuyên cần</span>
          <span className="text-3xl font-extrabold text-emerald-900 mt-1 block">98.2%</span>
          <span className="text-[11px] text-emerald-700/80">Xếp loại Tốt</span>
        </div>
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl">
          <span className="text-xs font-semibold text-blue-700 block">Số buổi có mặt</span>
          <span className="text-3xl font-extrabold text-blue-900 mt-1 block">27 buổi</span>
          <span className="text-[11px] text-blue-700/80">Tính từ đầu năm</span>
        </div>
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl">
          <span className="text-xs font-semibold text-amber-700 block">Số lần đi muộn</span>
          <span className="text-3xl font-extrabold text-amber-900 mt-1 block">1 lần</span>
          <span className="text-[11px] text-amber-700/80">Đã giải trình</span>
        </div>
        <div className="p-5 bg-purple-50 border border-purple-200 rounded-3xl">
          <span className="text-xs font-semibold text-purple-700 block">Nghỉ phép</span>
          <span className="text-3xl font-extrabold text-purple-900 mt-1 block">0 lần</span>
          <span className="text-[11px] text-purple-700/80">Không nghỉ buổi nào</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 font-bold text-sm text-slate-800">
          Nhật ký điểm danh chi tiết từng ngày
        </div>
        <div className="divide-y divide-slate-100">
          {history.map((h, i) => (
            <div key={i} className="p-4 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                {h.status === 'present' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-slate-900">
                    Ngày {new Date(h.date).toLocaleDateString('vi-VN')}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{h.label}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-xs ${
                  h.status === 'present'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {h.session}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
