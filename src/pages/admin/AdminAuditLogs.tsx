import React, { useState, useEffect } from 'react';
import { DataService, store } from '../../services/dataService';
import { AuditLogItem } from '../../types';
import { SearchBox } from '../../components/common/SearchBox';
import { History, Shield, Lock, Search, Filter } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    DataService.getAuditLogs().then(setLogs);
    const unsub = DataService.subscribe(() => {
      DataService.getAuditLogs().then(setLogs);
    });
    return unsub;
  }, []);

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-xl">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nhật ký Hoạt động Bảo mật (Audit Log)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi vết bất biến toàn bộ thao tác hệ thống: Đăng nhập, Điểm danh, Nhập điểm, Tạo lớp và Phân quyền (Không cho phép chỉnh sửa hoặc xóa)
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-mono font-semibold border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Bảo mật RLS Enforced</span>
        </span>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo hành động, người thực hiện, nội dung..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Loại hành động:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-1.5 outline-hidden"
          >
            <option value="all">Tất cả hành động</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="SWITCH_ROLE">SWITCH_ROLE</option>
            <option value="RECORD_ATTENDANCE">RECORD_ATTENDANCE</option>
            <option value="GRADE_SUBMISSION">GRADE_SUBMISSION</option>
            <option value="SAVE_GRADES">SAVE_GRADES</option>
            <option value="CREATE_CLASS">CREATE_CLASS</option>
            <option value="CREATE_ASSIGNMENT">CREATE_ASSIGNMENT</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Thời gian (UTC)</th>
              <th className="px-4 py-3">Người thực hiện</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Đối tượng</th>
              <th className="px-4 py-3">Chi tiết sự kiện</th>
              <th className="px-4 py-3 font-mono">Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-900 block">{log.user_name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{log.user_role}</span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-blue-700">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">{log.entity_type}</td>
                <td className="px-4 py-3 text-slate-700 max-w-md">{log.details}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
