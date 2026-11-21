import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { Search, Menu, BookOpen, Users, FileText, FolderArchive, Megaphone, Bell } from 'lucide-react';
import { store } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAssignmentWorkspace =
    location.pathname === '/teacher/assignments' ||
    (location.pathname.startsWith('/teacher/assignments/') &&
      !location.pathname.startsWith('/teacher/assignments/topics') &&
      !location.pathname.startsWith('/teacher/assignments/create') &&
      !location.pathname.startsWith('/teacher/assignments/new'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const canBrowseDirectory = role === 'teacher' || role === 'admin';

  // Filter global search results across entities based on query
  const queryLower = searchQuery.toLowerCase().trim();
  const matchedStudents =
    queryLower && canBrowseDirectory
      ? store.students
          .filter(
            (s) =>
              s.full_name.toLowerCase().includes(queryLower) ||
              s.student_code.toLowerCase().includes(queryLower)
          )
          .slice(0, 4)
      : [];

  const matchedClasses =
    queryLower && canBrowseDirectory
      ? store.classes
          .filter(
            (c) =>
              c.name.toLowerCase().includes(queryLower) ||
              c.join_code.toLowerCase().includes(queryLower)
          )
          .slice(0, 3)
      : [];

  const matchedAssignments = queryLower
    ? store.assignments.filter((a) => a.title.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];

  const matchedAnnouncements = queryLower
    ? store.announcements.filter((a) => a.title.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];

  const totalResults =
    matchedStudents.length + matchedClasses.length + matchedAssignments.length + matchedAnnouncements.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-hidden"
            title="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <Header
              onOpenSearch={() => setSearchOpen(true)}
              onOpenNotifications={() => setNotificationsOpen(true)}
              unreadCount={store.announcements.length}
            />
          </div>
        </div>

        {/* Page body */}
        <main
          className={`flex-1 w-full min-w-0 ${
            isAssignmentWorkspace ? 'p-3 sm:p-4 lg:p-5' : 'p-2 sm:p-3 lg:p-4'
          }`}
        >
          <Breadcrumb />
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <Modal
        isOpen={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        title="Tìm kiếm toàn hệ thống"
        subtitle="Tìm nhanh học sinh, lớp học, bài tập và thông báo"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên học sinh, mã số, tên lớp hoặc tiêu đề bài tập..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            />
          </div>

          {searchQuery && totalResults === 0 && (
            <p className="text-center py-8 text-sm text-slate-400">
              Không tìm thấy kết quả phù hợp với từ khóa "{searchQuery}"
            </p>
          )}

          {matchedStudents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Học sinh ({matchedStudents.length})
              </p>
              <div className="space-y-1">
                {matchedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/teacher/students/${s.id}`);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between text-sm transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{s.full_name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-mono">({s.student_code})</span>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {s.class_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedClasses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                Lớp học ({matchedClasses.length})
              </p>
              <div className="space-y-1">
                {matchedClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/teacher/classes/${c.id}`);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-between text-sm transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Mã: {c.join_code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedAssignments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                Bài tập ({matchedAssignments.length})
              </p>
              <div className="space-y-1">
                {matchedAssignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(
                        role === 'teacher' || role === 'admin'
                          ? `/teacher/assignments/${a.id}`
                          : `/${role}/assignments`
                      );
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center justify-between text-sm transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</span>
                    <span className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md ml-2 shrink-0">
                      {a.subject_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedAnnouncements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                Thông báo ({matchedAnnouncements.length})
              </p>
              <div className="space-y-1">
                {matchedAnnouncements.map((anc) => (
                  <button
                    key={anc.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/${role}/announcements`);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center justify-between text-sm transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{anc.title}</span>
                    <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md ml-2 shrink-0">
                      {anc.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Notification Center Drawer */}
      <Drawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Trung tâm thông báo"
        subtitle="Cập nhật hoạt động lớp học và nhà trường"
        width="md"
      >
        <div className="space-y-3">
          {store.announcements.map((anc) => (
            <div
              key={anc.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
              onClick={() => {
                setNotificationsOpen(false);
                navigate(`/${role}/announcements`);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{anc.author_name}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(anc.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{anc.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{anc.content}</p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};
