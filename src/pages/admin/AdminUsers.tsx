import React, { useState } from 'react';
import { DEMO_USERS } from '../../services/seedData';
import { UserProfile, UserRole } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { SearchBox } from '../../components/common/SearchBox';
import { Modal } from '../../components/common/Modal';
import { createFirebaseUserAccount } from '../../services/firebaseAuthAdminService';
import {
  Users,
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  Trash2,
  Edit,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([...DEMO_USERS]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: 'password123',
    role: 'teacher' as UserRole,
    phone: ''
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleToggleLock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    );
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createFirebaseUserAccount({
        email: formData.email.trim(),
        password: formData.password || 'password123',
        fullName: formData.full_name.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        schoolId: 'sch-001'
      });

      const newUser: UserProfile = {
        id: res.uid || 'usr-' + Date.now(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        school_id: 'sch-001',
        is_active: true,
        created_at: new Date().toISOString()
      };

      setUsers([newUser, ...users]);
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', password: 'password123', role: 'teacher', phone: '' });
      setNotification({
        type: 'success',
        message: `Đã tạo tài khoản "${newUser.full_name}" (${newUser.email}) và tự động lưu vào Firebase Authentication thành công!`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.error('Failed to create user in Firebase Auth:', err);
      setNotification({
        type: 'error',
        message: `Không thể tạo tài khoản: ${err?.message || 'Lỗi không xác định'}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản trị Người dùng & Phân quyền
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý tài khoản Giáo viên, Học sinh, Phụ huynh và Admin. Phân công vai trò và khóa/mở tài khoản.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs self-start sm:self-auto active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm người dùng mới</span>
        </button>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs sm:text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo họ tên, email..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Vai trò:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-1.5 outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="teacher">Giáo viên (Teacher)</option>
            <option value="student">Học sinh (Student)</option>
            <option value="parent">Phụ huynh (Parent)</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác bảo mật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        u.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                      }
                      alt={u.full_name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusChip status={u.role} size="sm" />
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{u.phone || '—'}</td>
                <td className="px-4 py-3.5">
                  {u.is_active ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                      Đã khóa
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right space-x-1">
                  <button
                    onClick={() => handleToggleLock(u.id)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      u.is_active
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                  >
                    {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => alert(`Đã gửi email khôi phục mật khẩu tới: ${u.email}`)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                    title="Đặt lại mật khẩu"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm tài khoản người dùng"
        subtitle="Cấp tài khoản và phân quyền vào hệ thống trường"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên người dùng *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="VD: Thầy Nguyễn Văn Hưng"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="hung.nv@school.edu.vn"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phân quyền</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              >
                <option value="teacher">Giáo viên (Teacher)</option>
                <option value="student">Học sinh (Student)</option>
                <option value="parent">Phụ huynh (Parent)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
              <input
                type="text"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="password123"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tài khoản sẽ được tự động lưu trực tiếp vào <strong>Firebase Authentication</strong> & Firestore.</span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <ShieldCheck className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
