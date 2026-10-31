import React, { useState } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { ChartCard } from '../../components/common/ChartCard';
import { TrendingUp, Award, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const StudentGrades: React.FC = () => {
  const grades = [
    { subject: 'Toán Học', tx1: 9.0, tx2: 8.5, tx3: 9.5, gk: 9.0, ck: 9.2, avg: 9.1 },
    { subject: 'Ngữ Văn', tx1: 8.0, tx2: 8.0, tx3: 8.5, gk: 8.0, ck: 8.5, avg: 8.2 },
    { subject: 'Tiếng Anh', tx1: 9.0, tx2: 9.5, tx3: 9.0, gk: 9.5, ck: 9.0, avg: 9.2 },
    { subject: 'Vật Lý', tx1: 8.5, tx2: 8.0, tx3: 8.5, gk: 8.5, ck: 8.8, avg: 8.5 },
    { subject: 'Hóa Học', tx1: 8.0, tx2: 8.5, tx3: 8.0, gk: 8.0, ck: 8.5, avg: 8.2 },
    { subject: 'Tin Học', tx1: 10.0, tx2: 9.5, tx3: 10.0, gk: 9.5, ck: 10.0, avg: 9.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bảng điểm cá nhân & Học bạ điện tử
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Bảng tổng hợp điểm kiểm tra thường xuyên, giữa kỳ và cuối kỳ học kỳ 1 (Năm học 2025 - 2026)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Điểm TB học kỳ (GPA)"
          value="8.83"
          subtitle="Xếp loại: Xuất sắc"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Môn điểm cao nhất"
          value="Tin Học (9.8)"
          subtitle="Hoàn thành xuất sắc"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Số môn trên 8.0"
          value="6 / 6 môn"
          subtitle="Đạt chuẩn học sinh giỏi"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Hạnh kiểm"
          value="Tốt (96đ)"
          subtitle="Xếp hạng #1 trong lớp"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 font-bold text-sm text-slate-800">
          Chi tiết điểm số từng môn học
        </div>
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Môn học</th>
              <th className="px-4 py-3 text-center">ĐGTX 1</th>
              <th className="px-4 py-3 text-center">ĐGTX 2</th>
              <th className="px-4 py-3 text-center">ĐGTX 3</th>
              <th className="px-4 py-3 text-center">Giữa kỳ (x2)</th>
              <th className="px-4 py-3 text-center">Cuối kỳ (x3)</th>
              <th className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/50">Điểm TB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grades.map((g) => (
              <tr key={g.subject} className="hover:bg-slate-50">
                <td className="px-4 py-3.5 font-bold text-slate-800">{g.subject}</td>
                <td className="px-4 py-3.5 text-center font-mono text-slate-700">{g.tx1}</td>
                <td className="px-4 py-3.5 text-center font-mono text-slate-700">{g.tx2}</td>
                <td className="px-4 py-3.5 text-center font-mono text-slate-700">{g.tx3}</td>
                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">{g.gk}</td>
                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">{g.ck}</td>
                <td className="px-4 py-3.5 text-center font-mono font-extrabold text-blue-700 bg-blue-50/30">
                  {g.avg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
