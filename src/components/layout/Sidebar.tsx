import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { SmartClassLogo } from '../common/SmartClassLogo';
import {
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
  CheckCircle2,
  SlidersHorizontal,
  Monitor,
  UserCog
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
  children?: NavItem[];
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
      {
        label: 'Giao bài tập',
        path: '/teacher/assignments',
        icon: FileText,
        children: [
          { label: 'Quản lý chủ đề', path: '/teacher/assignments/topics', icon: Layers },
          { label: 'Tạo bài tập', path: '/teacher/assignments/create-from-bank', icon: Sparkles },
          { label: 'Danh sách bài tập đã giao', path: '/teacher/assignments', icon: FileText }
        ]
      },
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
      {
        label: 'Cài đặt',
        path: '/teacher/settings',
        icon: Settings,
        children: [
          { label: 'Cài đặt hệ thống', path: '/teacher/settings/system', icon: SlidersHorizontal },
          { label: 'Cài đặt màn hình', path: '/teacher/settings/display', icon: Monitor },
          { label: 'Cài đặt tài khoản', path: '/teacher/settings/account', icon: UserCog }
        ]
      }
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
      { label: 'Thông báo', path: '/student/announcements', icon: Megaphone },
      {
        label: 'Cài đặt',
        path: '/student/settings',
        icon: Settings,
        children: [
          { label: 'Cài đặt hệ thống', path: '/student/settings/system', icon: SlidersHorizontal },
          { label: 'Cài đặt màn hình', path: '/student/settings/display', icon: Monitor },
          { label: 'Cài đặt tài khoản', path: '/student/settings/account', icon: UserCog }
        ]
      }
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
      { label: 'Bài tập của con', path: '/parent/assignments', icon: FileText },
      { label: 'Bảng điểm & Nhận xét', path: '/parent/grades', icon: FileSpreadsheet },
      { label: 'Chuyên cần & Điểm danh', path: '/parent/attendance', icon: CalendarCheck },
      { label: 'Lịch học trong tuần', path: '/parent/schedule', icon: CalendarDays }
    ]
  },
  {
    id: 'prn-2',
    title: 'Liên lạc & Tiện ích',
    icon: HeartHandshake,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
    items: [
      { label: 'Thông báo nhà trường', path: '/parent/announcements', icon: Megaphone },
      { label: 'Trao đổi với giáo viên', path: '/parent/messages', icon: HeartHandshake },
      {
        label: 'Cài đặt',
        path: '/parent/settings',
        icon: Settings,
        children: [
          { label: 'Cài đặt hệ thống', path: '/parent/settings/system', icon: SlidersHorizontal },
          { label: 'Cài đặt màn hình', path: '/parent/settings/display', icon: Monitor },
          { label: 'Cài đặt tài khoản', path: '/parent/settings/account', icon: UserCog }
        ]
      }
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
      {
        label: 'Cài đặt',
        path: '/admin/settings',
        icon: Settings,
        children: [
          { label: 'Cài đặt hệ thống', path: '/admin/settings/system', icon: SlidersHorizontal },
          { label: 'Cài đặt màn hình', path: '/admin/settings/display', icon: Monitor },
          { label: 'Cài đặt tài khoản', path: '/admin/settings/account', icon: UserCog }
        ]
      }
    ]
  }
];

const getModulesForRole = (role: string): ModuleSection[] => {
  if (role === 'student') return studentNav;
  if (role === 'parent') return parentNav;
  if (role === 'admin') return adminNav;
  return teacherModules;
};

const FIXED_SIDEBAR_WIDTH = 290;
const FIXED_FONT_SCALE = (280 / 256).toFixed(5); // Size chữ mặc định tương ứng zoom 280px

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile
}) => {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const asideRef = useRef<HTMLElement | null>(null);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const edgeSpeedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    asideRef.current?.style.setProperty('--sidebar-w', `${FIXED_SIDEBAR_WIDTH}px`);
    asideRef.current?.style.setProperty('--sidebar-scale', FIXED_FONT_SCALE);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stopEdgePan = () => {
    edgeSpeedRef.current = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runEdgePan = () => {
    const el = navScrollRef.current;
    if (!el || edgeSpeedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    el.scrollLeft += edgeSpeedRef.current;
    rafRef.current = requestAnimationFrame(runEdgePan);
  };

  const handleMouseEdgeMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = navScrollRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth + 1) {
      stopEdgePan();
      return;
    }
    const rect = el.getBoundingClientRect();
    const edgeThreshold = 34;
    const distLeft = e.clientX - rect.left;
    const distRight = rect.right - e.clientX;

    if (distRight >= 0 && distRight <= edgeThreshold) {
      const intensity = 1 - distRight / edgeThreshold;
      edgeSpeedRef.current = Math.max(2, Math.round(intensity * 9));
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(runEdgePan);
    } else if (distLeft >= 0 && distLeft <= edgeThreshold && el.scrollLeft > 0) {
      const intensity = 1 - distLeft / edgeThreshold;
      edgeSpeedRef.current = -Math.max(2, Math.round(intensity * 9));
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(runEdgePan);
    } else {
      stopEdgePan();
    }
  };

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

  // Submenu states for items with children (e.g. Giao bài tập, Cài đặt)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    '/teacher/assignments': true,
    '/teacher/settings': true,
    '/student/settings': true,
    '/parent/settings': true,
    '/admin/settings': true
  });

  // Automatically keep current module and submenu expanded when navigating
  useEffect(() => {
    setOpenModules((prev) => {
      let hasChange = false;
      const next = { ...prev };
      currentModules.forEach((mod) => {
        const isInside = mod.items.some((item) =>
          location.pathname.startsWith(item.path) ||
          (item.children && item.children.some((c) => location.pathname.startsWith(c.path)))
        );
        if (isInside && !prev[mod.id]) {
          next[mod.id] = true;
          hasChange = true;
        }
      });
      return hasChange ? next : prev;
    });

    if (location.pathname.startsWith('/teacher/assignments')) {
      setOpenSubmenus((prev) => ({ ...prev, '/teacher/assignments': true }));
    }
    const settingsBase = `/${role}/settings`;
    if (location.pathname.startsWith(settingsBase)) {
      setOpenSubmenus((prev) => ({ ...prev, [settingsBase]: true }));
    }
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

      {/* Sidebar container (fixed 290px frame, fixed 280px font scale) */}
      <aside
        ref={asideRef}
        style={
          {
            '--sidebar-w': `${FIXED_SIDEBAR_WIDTH}px`,
            '--sidebar-scale': FIXED_FONT_SCALE
          } as React.CSSProperties
        }
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:w-[290px] bg-slate-950 text-white flex flex-col border-r border-slate-800/80 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="min-h-16 py-2.5 flex items-center gap-2.5 px-3 border-b border-slate-800/80 bg-[#070D20] overflow-hidden">
          <SmartClassLogo
            variant="dark"
            size="md"
            className="lg:w-[calc(36px*var(--sidebar-scale,1.09375))] lg:h-[calc(36px*var(--sidebar-scale,1.09375))]"
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="font-bold text-sm lg:[font-size:calc(14px*var(--sidebar-scale,1.09375))] tracking-wide text-white leading-tight truncate">
              Smart Class
            </h1>
            <p className="text-[9px] lg:[font-size:calc(9px*var(--sidebar-scale,1.09375))] tracking-[-0.015em] whitespace-nowrap truncate font-medium leading-snug bg-linear-to-r from-[#00D4FF] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
              Hệ thống quản lý lớp học thông minh
            </p>
          </div>
        </div>

        {/* Top Direct Shortcut Links: Dashboard & Module Hub */}
        <div className="p-3 border-b border-slate-800/60 space-y-1 bg-slate-900/30">
          <NavLink
            to={homePath}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-semibold transition-all ${
                isActive
                  ? 'bg-linear-to-r from-[#2563FF] to-[#713BFF] text-white shadow-sm shadow-[#2563FF]/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 lg:w-[calc(16px*var(--sidebar-scale,1.09375))] lg:h-[calc(16px*var(--sidebar-scale,1.09375))] text-blue-400 shrink-0" />
            <span className="truncate">Tổng quan bảng điều khiển</span>
          </NavLink>

          {role === 'teacher' && (
            <NavLink
              to="/teacher/modules"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderKanban className="w-4 h-4 lg:w-[calc(16px*var(--sidebar-scale,1.09375))] lg:h-[calc(16px*var(--sidebar-scale,1.09375))] text-indigo-400 shrink-0" />
                <span className="truncate">Trung tâm các Module</span>
              </div>
              <span className="text-[10px] lg:[font-size:calc(10px*var(--sidebar-scale,1.09375))] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold shrink-0">
                Hub
              </span>
            </NavLink>
          )}
        </div>

        {/* Modular Navigation List (supports edge-hover horizontal scrolling without bottom slider bar) */}
        <div
          ref={navScrollRef}
          onMouseMove={handleMouseEdgeMove}
          onMouseLeave={stopEdgePan}
          className="flex-1 overflow-y-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 py-3"
        >
          <div className="space-y-3 min-w-full w-max">
          {currentModules.map((mod) => {
            const ModIcon = mod.icon;
            const isOpen = openModules[mod.id] ?? true;
            const isAnyItemActive = mod.items.some(
              (item) =>
                location.pathname.startsWith(item.path) ||
                Boolean(item.children?.some((c) => location.pathname.startsWith(c.path)))
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
                      className={`w-7 h-7 lg:w-[calc(28px*var(--sidebar-scale,1))] lg:h-[calc(28px*var(--sidebar-scale,1))] rounded-lg flex items-center justify-center shrink-0 ${
                        isAnyItemActive
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <ModIcon className="w-3.5 h-3.5 lg:w-[calc(14px*var(--sidebar-scale,1))] lg:h-[calc(14px*var(--sidebar-scale,1))]" />
                    </div>
                    <span className="text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-bold text-slate-200 group-hover:text-white whitespace-nowrap">
                      {mod.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[10px] lg:[font-size:calc(10px*var(--sidebar-scale,1.09375))] px-1.5 py-0.2 rounded-md font-semibold bg-slate-800 text-slate-400">
                      {mod.items.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 lg:w-[calc(14px*var(--sidebar-scale,1.09375))] lg:h-[calc(14px*var(--sidebar-scale,1.09375))] text-slate-400 transition-transform duration-200 ${
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
                      const hasChildren = Boolean(item.children && item.children.length > 0);
                      const isSubOpen = openSubmenus[item.path] ?? false;
                      const isChildActive = hasChildren && (
                        location.pathname === item.path ||
                        item.children!.some((sub) => location.pathname === sub.path)
                      );

                      if (hasChildren) {
                        return (
                          <div key={item.path} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenSubmenus((prev) => ({
                                  ...prev,
                                  [item.path]: !prev[item.path]
                                }));
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-semibold transition-all cursor-pointer ${
                                isChildActive
                                  ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ItemIcon className={`w-3.5 h-3.5 lg:w-[calc(14px*var(--sidebar-scale,1.09375))] lg:h-[calc(14px*var(--sidebar-scale,1.09375))] shrink-0 ${isChildActive ? 'text-purple-400' : 'opacity-80'}`} />
                                <span className="whitespace-nowrap">{item.label}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <span className="text-[9px] lg:[font-size:calc(9px*var(--sidebar-scale,1.09375))] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {item.children!.length}
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 lg:w-[calc(12px*var(--sidebar-scale,1.09375))] lg:h-[calc(12px*var(--sidebar-scale,1.09375))] text-slate-400 transition-transform duration-200 ${
                                    isSubOpen ? 'rotate-180' : 'rotate-0'
                                  }`}
                                />
                              </div>
                            </button>

                            {isSubOpen && (
                              <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-purple-500/30 ml-3.5 my-1">
                                {item.children!.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubActive = location.pathname === sub.path;

                                  return (
                                    <NavLink
                                      key={sub.path + sub.label}
                                      to={sub.path}
                                      onClick={onCloseMobile}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-medium transition-all ${
                                        isSubActive
                                          ? 'bg-gradient-to-r from-[#009ED0] to-[#2563EB] text-white font-bold shadow-xs'
                                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <SubIcon className={`w-3 h-3 lg:w-[calc(12px*var(--sidebar-scale,1.09375))] lg:h-[calc(12px*var(--sidebar-scale,1.09375))] shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="whitespace-nowrap">{sub.label}</span>
                                      </div>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs lg:[font-size:calc(12px*var(--sidebar-scale,1.09375))] font-medium transition-all ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                            }`
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon className="w-3.5 h-3.5 lg:w-[calc(14px*var(--sidebar-scale,1.09375))] lg:h-[calc(14px*var(--sidebar-scale,1.09375))] shrink-0 opacity-80" />
                            <span className="whitespace-nowrap">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className="text-[9px] lg:[font-size:calc(9px*var(--sidebar-scale,1.09375))] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 ml-2">
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
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
          <span className="truncate">SmartClass v2.5</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            4 Phân Hệ Sẵn Sàng
          </span>
        </div>
      </aside>
    </>
  );
};
