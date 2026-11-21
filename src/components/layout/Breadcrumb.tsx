import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const pathNameMap: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
  admin: 'Quản trị viên',
  dashboard: 'Tổng quan',
  modules: 'Trung tâm Module',
  classes: 'Lớp học',
  create: 'Tạo mới',
  students: 'Hồ sơ học sinh',
  import: 'Nhập Excel',
  attendance: 'Điểm danh',
  history: 'Lịch sử',
  schedule: 'Thời khóa biểu',
  assignments: 'Bài tập',
  topics: 'Chủ đề bài học',
  'create-from-bank': 'Tạo bài tập từ ngân hàng',
  'create-quick': 'Tạo nhanh bài tập',
  'question-bank': 'Ngân hàng câu hỏi',
  'auto-grading': 'Chấm bài tự động',
  grading: 'Chấm điểm',
  quizzes: 'Kiểm tra',
  results: 'Kết quả',
  resources: 'Học liệu',
  ai: 'Trợ lý AI',
  grades: 'Sổ điểm',
  'attendance-analytics': 'Thống kê chuyên cần',
  behavior: 'Hành vi & Thi đua',
  rewards: 'Khen thưởng',
  alerts: 'Cảnh báo',
  tools: 'Công cụ lớp học',
  announcements: 'Thông báo',
  messages: 'Tin nhắn',
  reports: 'Báo cáo',
  submissions: 'Bài nộp',
  profile: 'Hồ sơ',
  settings: 'Cài đặt',
  system: 'Cài đặt hệ thống',
  display: 'Cài đặt màn hình',
  account: 'Cài đặt tài khoản',
  schools: 'Trường học',
  academic: 'Năm học & Khối',
  users: 'Người dùng',
  roles: 'Phân quyền',
  audit: 'Nhật ký bảo mật'
};

interface BreadcrumbProps {
  isDark?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const isAssignmentListRoute =
    location.pathname === '/teacher/assignments' ||
    (location.pathname.startsWith('/teacher/assignments/') &&
      !location.pathname.startsWith('/teacher/assignments/topics') &&
      !location.pathname.startsWith('/teacher/assignments/create') &&
      !location.pathname.startsWith('/teacher/assignments/new'));

  if (isAssignmentListRoute) {
    const isReports = location.pathname.endsWith('/reports');
    const hasSubmission = location.pathname.includes('/submissions/');

    return (
      <nav className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
        <Link
          to="/teacher/dashboard"
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-1.5" />
        <Link to="/teacher/modules" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Dạy &amp; Học
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-1.5" />
        <Link to="/teacher/assignments" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Giao bài tập
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-1.5" />
        {isReports || hasSubmission ? (
          <>
            <Link to="/teacher/assignments" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Danh sách bài tập đã giao
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-1.5" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {isReports ? 'Báo cáo lượt giao' : 'Chấm & Xem bài làm'}
            </span>
          </>
        ) : (
          <span className="font-semibold text-slate-800 dark:text-slate-100">Danh sách bài tập đã giao</span>
        )}
      </nav>
    );
  }

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = pathNameMap[segment] || segment;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-1.5" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-100">{name}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

