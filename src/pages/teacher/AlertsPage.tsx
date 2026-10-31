import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { AlertItem } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { Tabs } from '../../components/common/Tabs';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  Filter,
  ShieldAlert,
  BellRing
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'viewed' | 'in_progress' | 'resolved'>('all');

  const loadAlerts = async () => {
    const list = await DataService.getAlerts();
    setAlerts(list);
  };

  useEffect(() => {
    loadAlerts();
    const unsub = DataService.subscribe(loadAlerts);
    return unsub;
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: AlertItem['status']) => {
    await DataService.updateAlertStatus(id, newStatus);
    loadAlerts();
  };

  const filtered = alerts.filter((a) => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'Tất cả cảnh báo', badge: alerts.length },
    { id: 'new', label: 'Mới phát sinh', badge: alerts.filter((a) => a.status === 'new').length },
    { id: 'viewed', label: 'Đã xem', badge: alerts.filter((a) => a.status === 'viewed').length },
    {
      id: 'in_progress',
      label: 'Đang xử lý',
      badge: alerts.filter((a) => a.status === 'in_progress').length
    },
    {
      id: 'resolved',
      label: 'Đã giải quyết',
      badge: alerts.filter((a) => a.status === 'resolved').length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hệ thống Cảnh báo Thông minh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quy trình theo dõi và xử lý cảnh báo chuyên cần, học tập và hành vi: Mới → Đã xem → Đang xử lý → Đã giải quyết
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => setActiveTab(t as any)} />
      </div>

      {/* Alert Cards */}
      <div className="space-y-3.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.severity === 'critical' || item.severity === 'high'
                    ? 'bg-rose-50 text-rose-600 ring-4 ring-rose-50'
                    : 'bg-amber-50 text-amber-600 ring-4 ring-amber-50'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {item.type}
                  </span>
                  <StatusChip status={item.status} size="sm" />
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">{item.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Phân công: <strong className="text-slate-700">{item.assigned_to || 'Giáo viên'}</strong>
                </p>
              </div>
            </div>

            {/* Workflow status advance buttons */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
              {item.status === 'new' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'viewed')}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xác nhận đã xem</span>
                </button>
              )}

              {item.status === 'viewed' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Chuyển sang Đang xử lý</span>
                </button>
              )}

              {item.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'resolved')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã giải quyết xong</span>
                </button>
              )}

              {item.status === 'resolved' && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã hoàn tất xử lý
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
