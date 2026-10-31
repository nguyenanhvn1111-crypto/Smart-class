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
  grading: 'Chấm điểm',
  quizzes: 'Kiểm tra',
  results: 'Kết quả',
  resources: 'Học liệu',
  ai: 'Trợ lý AI',
  grades: 'Sổ điểm',
  'attendance-analytics': 'Thống kê chuyên cần',
  behavior: 'Hành vi & Thi đua',
  alerts: 'Cảnh báo',
  tools: 'Công cụ lớp học',
  announcements: 'Thông báo',
  reports: 'Báo cáo',
  profile: 'Hồ sơ',
  settings: 'Cài đặt',
  schools: 'Trường học',
  academic: 'Năm học & Khối',
  users: 'Người dùng',
  roles: 'Phân quyền',
  audit: 'Nhật ký bảo mật'
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = pathNameMap[segment] || segment;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1.5" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{name}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600 transition-colors">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
