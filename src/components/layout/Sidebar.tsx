import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  FileText,
  HelpCircle,
  FolderArchive,
  Sparkles,
  BarChart3,
  Award,
  AlertTriangle,
  Wrench,
  Megaphone,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Building2,
  Layers,
  History,
  HeartHandshake,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  badge?: string;
}

interface ModuleSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  activeColor: string;
  items: NavItem[];
}

// Navigation module groups for Teacher
const teacherModules: ModuleSection[] = [
  {
    id: 'module-classes',
    title: 'Quản lý Lớp học',
    icon: BookOpen,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
    items: [
      { label: 'Lớp của tôi', path: '/teacher/classes', icon: BookOpen },
      { label: 'Học sinh & Hồ sơ 360°', path: '/teacher/students', icon: Users },
      { label: 'Điểm danh điện tử', path: '/teacher/attendance', icon: CalendarCheck },
      { label: 'Thời khóa biểu', path: '/teacher/schedule', icon: CalendarDays }
    ]
  },
  {
    id: 'module-teaching',
    title: 'Dạy và Học',
    icon: Sparkles,
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/10 border-purple-500/40 text-purple-300',
    items: [
      { label: 'Ngân hàng câu hỏi', path: '/teacher/question-bank', icon: HelpCircle },
      { label: 'Giao bài tập', path: '/teacher/assignments', icon: FileText },
      { label: 'Chấm bài tự động', path: '/teacher/auto-grading', icon: CheckCircle2 },
      { label: 'Tài liệu số', path: '/teacher/resources', icon: FolderArchive },
      { label: 'AI HỖ TRỢ', path: '/teacher/ai', icon: Sparkles, badge: 'Smart' }
    ]
  },
  {
    id: 'module-monitoring',
    title: 'Theo dõi & Đánh giá',
    icon: BarChart3,
    color: 'text-emerald-400',
    activeColor: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    items: [
      { label: 'Sổ điểm Spreadsheet', path: '/teacher/grades', icon: FileSpreadsheet },
      { label: 'Chuyên cần', path: '/teacher/attendance-analytics', icon: BarChart3 },
      { label: 'Hành vi & Thi đua', path: '/teacher/behavior', icon: Award },
      { label: 'Cảnh báo thông minh', path: '/teacher/alerts', icon: AlertTriangle, badge: '3' }
    ]
  },
  {
    id: 'module-tools',
    title: 'Tiện ích & Báo cáo',
    icon: Wrench,
    color: 'text-amber-400',
    activeColor: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
    items: [
      { label: 'Công cụ lớp học', path: '/teacher/tools', icon: Wrench },
      { label: 'Thông báo nhà trường', path: '/teacher/announcements', icon: Megaphone },
      { label: 'Báo cáo & Thống kê', path: '/teacher/reports', icon: BarChart3 },
      { label: 'Cài đặt tài khoản', path: '/teacher/settings', icon: Settings }
    ]
  }
];

// Student Navigation
const studentNav: ModuleSection[] = [
  {
    id: 'std-1',
    title: 'Học tập & Lịch trình',
    icon: BookOpen,
    color: 'text-emerald-400',
    activeColor: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    items: [
      { label: 'Lịch học tuần', path: '/student/schedule', icon: CalendarDays },
      { label: 'Bài tập cần làm', path: '/student/assignments', icon: FileText, badge: '2' },
      { label: 'Bài kiểm tra / Quiz', path: '/student/quizzes', icon: HelpCircle },
      { label: 'Học liệu số', path: '/student/resources', icon: FolderArchive }
    ]
  },
  {
    id: 'std-2',
    title: 'Kết quả & Đánh giá',
    icon: Award,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
    items: [
      { label: 'Bảng điểm cá nhân', path: '/student/grades', icon: FileSpreadsheet },
      { label: 'Chuyên cần', path: '/student/attendance', icon: CalendarCheck },
      { label: 'Thành tích & Huy hiệu', path: '/student/rewards', icon: Award },
      { label: 'Thông báo', path: '/student/announcements', icon: Megaphone }
    ]
  }
];

// Parent Navigation
const parentNav: ModuleSection[] = [
  {
    id: 'prn-1',
    title: 'Theo dõi Học tập của Con',
    icon: Users,
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/10 border-purple-500/40 text-purple-300',
    items: [
      { label: 'Hồ sơ học tập', path: '/parent/students', icon: Users },
      { label: 'Bảng điểm & Nhận xét', path: '/parent/grades', icon: FileSpreadsheet },
      { label: 'Chuyên cần & Điểm danh', path: '/parent/attendance', icon: CalendarCheck },
      { label: 'Lịch học trong tuần', path: '/parent/schedule', icon: CalendarDays }
    ]
  },
  {
    id: 'prn-2',
    title: 'Liên lạc & Thông tin',
    icon: HeartHandshake,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
    items: [
      { label: 'Thông báo nhà trường', path: '/parent/announcements', icon: Megaphone },
      { label: 'Trao đổi với giáo viên', path: '/parent/messages', icon: HeartHandshake }
    ]
  }
];

// Admin Navigation
const adminNav: ModuleSection[] = [
  {
    id: 'adm-1',
    title: 'Quản trị Nhà trường',
    icon: Building2,
    color: 'text-rose-400',
    activeColor: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
    items: [
      { label: 'Thông tin trường', path: '/admin/schools', icon: Building2 },
      { label: 'Năm học & Khối & Môn', path: '/admin/academic', icon: Layers },
      { label: 'Quản lý người dùng', path: '/admin/users', icon: Users },
      { label: 'Quản lý lớp học', path: '/admin/classes', icon: BookOpen }
    ]
  },
  {
    id: 'adm-2',
    title: 'Bảo mật & Báo cáo',
    icon: ShieldCheck,
    color: 'text-indigo-400',
    activeColor: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300',
    items: [
      { label: 'Phân quyền & RLS', path: '/admin/roles', icon: ShieldCheck },
      { label: 'Nhật ký bảo mật (Audit)', path: '/admin/audit', icon: History },
      { label: 'Báo cáo toàn trường', path: '/admin/reports', icon: BarChart3 },
      { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings }
    ]
  }
];

const getModulesForRole = (role: string): ModuleSection[] => {
  if (role === 'student') return studentNav;
  if (role === 'parent') return parentNav;
  if (role === 'admin') return adminNav;
  return teacherModules;
};

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile
}) => {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentModules = getModulesForRole(role);
  let homePath = '/teacher/dashboard';
  if (role === 'student') {
    homePath = '/student/dashboard';
  } else if (role === 'parent') {
    homePath = '/parent/dashboard';
  } else if (role === 'admin') {
    homePath = '/admin/dashboard';
  }

  // Accordion open states (default: all open for easy navigation)
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    'module-classes': true,
    'module-teaching': true,
    'module-monitoring': true,
    'module-tools': true,
    'std-1': true,
    'std-2': true,
    'prn-1': true,
    'prn-2': true,
    'adm-1': true,
    'adm-2': true
  });

  // Automatically keep current module expanded when navigating
  useEffect(() => {
    setOpenModules((prev) => {
      let hasChange = false;
      const next = { ...prev };
      currentModules.forEach((mod) => {
        const isInside = mod.items.some((item) => location.pathname.startsWith(item.path));
        if (isInside && !prev[mod.id]) {
          next[mod.id] = true;
          hasChange = true;
        }
      });
      return hasChange ? next : prev;
    });
  }, [location.pathname, role]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-slate-800/80 shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
              SmartClass
            </h1>
            <p className="text-[10px] text-blue-400 font-medium">Hệ thống Module số</p>
          </div>
        </div>

        {/* Top Direct Shortcut Links: Dashboard & Module Hub */}
        <div className="p-3 border-b border-slate-800/60 space-y-1 bg-slate-900/30">
          <NavLink
            to={homePath}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>Tổng quan bảng điều khiển</span>
          </NavLink>

          {role === 'teacher' && (
            <NavLink
              to="/teacher/modules"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>Trung tâm các Module</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Hub
              </span>
            </NavLink>
          )}
        </div>

        {/* Modular Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {currentModules.map((mod) => {
            const ModIcon = mod.icon;
            const isOpen = openModules[mod.id] ?? true;
            const isAnyItemActive = mod.items.some((item) =>
              location.pathname.startsWith(item.path)
            );

            return (
              <div
                key={mod.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isAnyItemActive
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700/60'
                }`}
              >
                {/* Module Header Card */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between p-2.5 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isAnyItemActive
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <ModIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {mod.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-800 text-slate-400">
                      {mod.items.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-items in Module Container */}
                {isOpen && (
                  <div className="p-1 pt-0 space-y-0.5 border-t border-slate-800/40">
                    {mod.items.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                            }`
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>SmartClass v2.5</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            4 Phân Hệ Sẵn Sàng
          </span>
        </div>
      </aside>
    </>
  );
};
