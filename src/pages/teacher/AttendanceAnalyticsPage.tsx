import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { ChartCard } from '../../components/common/ChartCard';
import { StatCard } from '../../components/common/StatCard';
import { CalendarCheck, Users, AlertTriangle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
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

export const AttendanceAnalyticsPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const dataDaily = [
    { day: 'Thứ 2', present: 24, absent: 0, late: 0 },
    { day: 'Thứ 3', present: 23, absent: 1, late: 0 },
    { day: 'Thứ 4', present: 24, absent: 0, late: 0 },
    { day: 'Thứ 5', present: 22, absent: 1, late: 1 },
    { day: 'Thứ 6', present: 24, absent: 0, late: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thống kê & Phân tích Chuyên cần
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp dữ liệu hiện diện, vắng phép, không phép và đi trễ của học sinh trong tuần và tháng
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Lớp:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-bold text-blue-700 bg-transparent outline-hidden cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tỷ lệ chuyên cần tháng"
          value="96.8%"
          subtitle="Tăng 0.6% so với tháng trước"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Tổng lượt vắng có phép"
          value="3 lượt"
          subtitle="Có đơn xin nghỉ qua hệ thống"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Vắng không phép"
          value="0"
          subtitle="Không có trường hợp trốn học"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Lượt đi muộn"
          value="2 lượt"
          subtitle="Cần theo dõi thêm"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <ChartCard
        title="Biểu đồ chuyên cần theo ngày trong tuần"
        subtitle="Số lượng học sinh có mặt và vắng theo từng buổi học"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dataDaily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
            <YAxis stroke="#64748B" fontSize={11} />
            <Tooltip />
            <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} name="Có mặt" />
            <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Đi muộn" />
            <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} name="Vắng" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
