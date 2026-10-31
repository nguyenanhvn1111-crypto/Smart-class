import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService, store } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { ChartCard } from '../../components/common/ChartCard';
import { StatusChip } from '../../components/common/StatusChip';
import {
  Building2,
  Users,
  BookOpen,
  History,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  CalendarCheck,
  ChevronRight,
  TrendingUp
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

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const userDistribution = [
    { name: 'Học sinh', count: 480, fill: '#10B981' },
    { name: 'Phụ huynh', count: 420, fill: '#8B5CF6' },
    { name: 'Giáo viên', count: 45, fill: '#3B82F6' },
    { name: 'Quản trị viên', count: 4, fill: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-2 text-indigo-300">
            Hệ thống Quản trị Toàn trường • SmartClass Admin Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bảng điều khiển Quản trị viên
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Giám sát vận hành 1 trường học, 24 lớp, 45 giáo viên và toàn bộ cơ sở dữ liệu PostgreSQL / Supabase
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            Quản lý Người dùng
          </button>
          <button
            onClick={() => navigate('/admin/audit')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all"
          >
            Nhật ký Audit Log
          </button>
        </div>
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng người dùng"
          value="949"
          subtitle="98% tài khoản kích hoạt"
          icon={Users}
          color="blue"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Lớp học đang mở"
          value="24 lớp"
          subtitle="Khối 10, 11 và 12"
          icon={BookOpen}
          color="emerald"
          onClick={() => navigate('/admin/classes')}
        />
        <StatCard
          title="Nhật ký bảo mật"
          value={`${store.auditLogs.length} sự kiện`}
          subtitle="Kiểm toán hệ thống đầy đủ"
          icon={History}
          color="purple"
          onClick={() => navigate('/admin/audit')}
        />
        <StatCard
          title="Trạng thái máy chủ"
          value="100% Hoạt động"
          subtitle="Độ trễ phản hồi: 45ms"
          icon={Server}
          color="amber"
        />
      </div>

      {/* Charts and Audit Logs preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartCard
            title="Cơ cấu tài khoản người dùng"
            subtitle="Phân bố tài khoản giữa các vai trò trong trường"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={userDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Số lượng tài khoản" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Security Audit quick card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Nhật ký Audit gần nhất</h3>
            <button
              onClick={() => navigate('/admin/audit')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {store.auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2">{log.details}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{log.user_name}</span>
                  <span className="font-mono">{log.ip_address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
