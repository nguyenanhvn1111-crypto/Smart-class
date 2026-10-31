import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import {
  BookOpen,
  Users,
  CalendarCheck,
  CalendarDays,
  FileText,
  HelpCircle,
  FolderArchive,
  Sparkles,
  FileSpreadsheet,
  BarChart3,
  Award,
  AlertTriangle,
  Wrench,
  Megaphone,
  Settings,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const ModulesOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClass } = useClass();

  const modules = [
    {
      id: 'module-classes',
      title: 'Quản lý Lớp học',
      description: 'Quản trị hồ sơ lớp, danh sách học sinh, điểm danh sĩ số hàng ngày và thời khóa biểu',
      color: 'from-blue-600 to-indigo-600',
      border: 'border-blue-200 hover:border-blue-500',
      badge: '4 Chức năng',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: BookOpen,
      items: [
        { label: 'Lớp của tôi', path: '/teacher/classes', desc: 'Quản lý thông tin & mã tham gia lớp', icon: BookOpen },
        { label: 'Học sinh & Hồ sơ 360°', path: '/teacher/students', desc: 'Tra cứu hồ sơ, liên hệ phụ huynh', icon: Users },
        { label: 'Điểm danh điện tử', path: '/teacher/attendance', desc: 'Ghi nhận hiện diện, đi muộn, nghỉ phép', icon: CalendarCheck },
        { label: 'Thời khóa biểu', path: '/teacher/schedule', desc: 'Lịch dạy trong tuần theo tiết', icon: CalendarDays }
      ]
    },
    {
      id: 'module-teaching',
      title: 'Dạy và Học',
      description: 'Ngân hàng câu hỏi, giao bài tập, chấm bài tự động, tài liệu số và AI trợ giảng',
      color: 'from-purple-600 to-indigo-600',
      border: 'border-purple-200 hover:border-purple-500',
      badge: '5 Chức năng',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Sparkles,
      items: [
        { label: 'Ngân hàng câu hỏi', path: '/teacher/question-bank', desc: 'Kho câu hỏi chuẩn 9 dạng, sinh AI & xuất đề thi A4', icon: HelpCircle },
        { label: 'Giao bài tập', path: '/teacher/assignments', desc: 'Tạo bài tập về nhà, thời hạn nộp & đính kèm', icon: FileText },
        { label: 'Chấm bài tự động', path: '/teacher/auto-grading', desc: 'Chấm điểm trắc nghiệm & nhận xét AI tự động', icon: CheckCircle2 },
        { label: 'Tài liệu số', path: '/teacher/resources', desc: 'Slide, tài liệu tham khảo, bài giảng điện tử', icon: FolderArchive },
        { label: 'AI HỖ TRỢ', path: '/teacher/ai', desc: 'Soạn giáo án 5512 & câu hỏi thông minh bằng AI', icon: Sparkles }
      ]
    },
    {
      id: 'module-monitoring',
      title: 'Theo dõi & Đánh giá',
      description: 'Sổ điểm bảng tính điện tử, phân tích chuyên cần, thi đua rèn luyện và cảnh báo thông minh',
      color: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-200 hover:border-emerald-500',
      badge: '4 Chức năng',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: BarChart3,
      items: [
        { label: 'Sổ điểm Spreadsheet', path: '/teacher/grades', desc: 'Nhập điểm trực quan, tính điểm TB tự động', icon: FileSpreadsheet },
        { label: 'Thống kê Chuyên cần', path: '/teacher/attendance-analytics', desc: 'Biểu đồ phân tích tỷ lệ đi học', icon: BarChart3 },
        { label: 'Hành vi & Thi đua', path: '/teacher/behavior', desc: 'Cộng/trừ điểm rèn luyện và bảng xếp hạng', icon: Award },
        { label: 'Cảnh báo thông minh', path: '/teacher/alerts', desc: 'Quy trình xử lý nguy cơ học tập/chuyên cần', icon: AlertTriangle }
      ]
    },
    {
      id: 'module-tools',
      title: 'Tiện ích & Báo cáo',
      description: 'Hộp công cụ tương tác trên lớp, hệ thống thông báo gửi phụ huynh và xuất báo cáo tổng hợp',
      color: 'from-amber-600 to-orange-600',
      border: 'border-amber-200 hover:border-amber-500',
      badge: '4 Chức năng',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Wrench,
      items: [
        { label: 'Hộp công cụ lớp học', path: '/teacher/tools', desc: 'Vòng quay, chọn ngẫu nhiên, chia nhóm, timer', icon: Wrench },
        { label: 'Thông báo nhà trường', path: '/teacher/announcements', desc: 'Gửi thông báo có xác nhận "Tôi đã đọc"', icon: Megaphone },
        { label: 'Báo cáo & Thống kê', path: '/teacher/reports', desc: 'Xuất file Excel CSV và in ấn phiếu báo', icon: BarChart3 },
        { label: 'Cài đặt tài khoản', path: '/teacher/settings', desc: 'Cấu hình hồ sơ và bảo mật mật khẩu', icon: Settings }
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Kiến trúc Modular Education
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trung tâm Các Phân Hệ Lớp Học
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-2xl">
            Toàn bộ chức năng của hệ thống SmartClass được phân hóa thành các phân hệ chuyên biệt, phục vụ đầy đủ công tác giảng dạy và quản trị lớp học.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 self-start md:self-auto text-xs font-semibold">
          <span>Lớp đang chọn:</span>
          <span className="text-blue-300 font-bold">{selectedClass?.name || '10A1'}</span>
        </div>
      </div>

      {/* Grid of 4 Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((mod) => {
          const ModIcon = mod.icon;
          return (
            <div
              key={mod.id}
              className={`bg-white rounded-3xl border ${mod.border} p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
                {/* Module Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-linear-to-tr ${mod.color} flex items-center justify-center text-white shadow-md shadow-blue-500/10`}
                    >
                      <ModIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{mod.title}</h2>
                      <span className="text-[11px] text-slate-400 font-medium">Hệ thống chức năng cốt lõi</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${mod.badgeColor}`}
                  >
                    {mod.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-5 leading-relaxed">{mod.description}</p>

                {/* Sub-items in this Module */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mod.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ItemIcon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
