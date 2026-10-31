import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import { UserRole } from '../../types';
import {
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  Users,
  Settings,
  Sparkles,
  BookOpen,
  CalendarCheck,
  FilePlus,
  Award,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  unreadCount = 3
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const { classes, selectedClassId, setSelectedClassId } = useClass();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const roles: { key: UserRole; label: string; color: string; desc: string }[] = [
    { key: 'teacher', label: 'Giáo viên', color: 'bg-blue-600', desc: 'Quản lý giảng dạy, TKB, điểm danh' },
    { key: 'student', label: 'Học sinh', color: 'bg-emerald-600', desc: 'Xem TKB, nộp bài, điểm số cá nhân' },
    { key: 'parent', label: 'Phụ huynh', color: 'bg-purple-600', desc: 'Theo dõi con em, xem lịch, liên lạc' },
    { key: 'admin', label: 'Admin', color: 'bg-rose-600', desc: 'Quản trị hệ thống toàn trường' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left section: Global Search & Class Selector */}
      <div className="flex items-center gap-3">
        {/* Global Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/60 rounded-xl text-slate-500 text-xs sm:text-sm transition-all border border-transparent hover:border-slate-300/60 w-36 sm:w-64"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Tìm kiếm nhanh...</span>
          <span className="sm:hidden">Tìm...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white text-slate-400 font-mono px-1.5 py-0.5 rounded-md border border-slate-200">
            ⌘K
          </kbd>
        </button>

        {/* Context-aware Class Selector (visible when teacher) */}
        {role === 'teacher' && classes.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-blue-50/70 border border-blue-200/60 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-blue-700 font-medium">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent font-semibold text-blue-900 border-none outline-hidden cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right section: Role badge, Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hiển thị vai trò người dùng (có thể click để chuyển đổi nhanh) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
            title="Bấm để đổi vai trò nhanh"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                role === 'teacher'
                  ? 'bg-blue-600 ring-2 ring-blue-300'
                  : role === 'student'
                  ? 'bg-emerald-600 ring-2 ring-emerald-300'
                  : role === 'parent'
                  ? 'bg-purple-600 ring-2 ring-purple-300'
                  : 'bg-rose-600 ring-2 ring-rose-300'
              }`}
            />
            <span className="text-slate-500 hidden sm:inline font-medium">Vai trò:</span>
            <span className="font-bold text-slate-900">
              {roles.find((r) => r.key === role)?.label || 'Giáo viên'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setShowRoleMenu(false)}
            >
              <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chuyển nhanh vai trò
                </p>
                <p className="text-[11px] text-slate-500">
                  Chọn vai trò để chuyển không gian làm việc
                </p>
              </div>

              {roles.map((r) => {
                const isCurrent = r.key === role;
                let targetPath = '/teacher/dashboard';
                if (r.key === 'student') targetPath = '/student/dashboard';
                else if (r.key === 'parent') targetPath = '/parent/dashboard';
                else if (r.key === 'admin') targetPath = '/admin/dashboard';

                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      switchRole(r.key);
                      navigate(targetPath);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                      <div>
                        <div className="leading-tight">{r.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal leading-tight">{r.desc}</div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">
                        Đang chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Create Button (Teacher & Admin) */}
        {(role === 'teacher' || role === 'admin') && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo nhanh</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showQuickCreate && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowQuickCreate(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Thao tác nhanh
                </div>
                <button
                  onClick={() => navigate('/teacher/attendance')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                >
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Điểm danh hôm nay</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/assignments/create')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                >
                  <FilePlus className="w-4 h-4 text-purple-600" />
                  <span>Giao bài tập mới</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/quizzes/create')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Tạo bài kiểm tra / Quiz</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/ai')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span>AI Trợ lý giáo án</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/classes/create')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Thêm lớp học</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.full_name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.full_name || 'Người dùng'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">{role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Vai trò:</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {roles.find((r) => r.key === role)?.label || role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/${role}/profile`)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Hồ sơ cá nhân</span>
              </button>
              <button
                onClick={() => navigate(`/${role}/settings`)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Cài đặt tài khoản</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
