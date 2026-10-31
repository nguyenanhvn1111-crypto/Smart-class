import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { Student, Announcement } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Award,
  Bell,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  BookOpen,
  Calendar
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Child switcher: Multiple children support
  const childrenList: { id: string; name: string; class: string; code: string; avatar: string }[] = [
    {
      id: 'stu-001',
      name: 'Lê Hoàng Long',
      class: '10A1 - Chuyên Toán',
      code: 'HS10001',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'
    },
    {
      id: 'stu-003',
      name: 'Lê Minh Anh',
      class: '10A1 - Chuyên Toán',
      code: 'HS10003',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    }
  ];

  const [selectedChildId, setSelectedChildId] = useState('stu-001');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    DataService.getAnnouncements().then(setAnnouncements);
  }, []);

  const activeChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Child Switcher */}
      <div className="bg-linear-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              Cổng thông tin Dành cho Phụ huynh
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kính chào Quý phụ huynh! 👋
            </h1>
            <p className="mt-1 text-sm text-purple-100 max-w-xl">
              Cập nhật tức thời thông tin chuyên cần, điểm số và sinh hoạt lớp của con tại trường.
            </p>
          </div>

          {/* Child Switcher Component */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 self-start md:self-auto">
            <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider px-2 block mb-1">
              Đang xem thông tin của con:
            </span>
            <div className="flex gap-2">
              {childrenList.map((child) => {
                const isSelected = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-purple-900 shadow-md font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{child.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Child KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chuyên cần hôm nay"
          value="Có mặt đúng giờ"
          subtitle="Điểm danh lúc 07:35"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Điểm TB hiện tại"
          value={activeChild.id === 'stu-001' ? '8.8 / 10' : '8.5 / 10'}
          subtitle="Xếp loại Học sinh Giỏi"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Điểm rèn luyện"
          value={activeChild.id === 'stu-001' ? '96 điểm' : '94 điểm'}
          subtitle="Hạnh kiểm Tốt"
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Bài tập về nhà"
          value="2 bài cần làm"
          subtitle="Hạn nộp đến 08/10"
          icon={BookOpen}
          color="amber"
        />
      </div>

      {/* Grid: Academic Overview & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Homeroom Teacher Contact Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120"
                alt="Teacher"
                className="w-14 h-14 rounded-2xl object-cover ring-4 ring-blue-50"
              />
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Giáo viên chủ nhiệm lớp {activeChild.class}
                </span>
                <h3 className="text-base font-bold text-slate-900">Cô Trần Thị Mai</h3>
                <p className="text-xs text-slate-500 mt-0.5">Phụ trách bộ môn: Toán Học</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/parent/messages')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Nhắn tin trao đổi</span>
              </button>
              <a
                href="tel:0988123456"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Gọi điện"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Recent Teacher's Feedback */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900">Nhận xét rèn luyện của thầy cô</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-700">Cô Trần Thị Mai (GVCN)</span>
                <span>02/10/2026</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-sm">
                "Em {activeChild.name} học tập rất chăm chỉ, đặc biệt có tư duy toán học nhạy bén và tích cực
                hỗ trợ các bạn trong giờ sinh hoạt nhóm. Đi học đúng giờ và chấp hành nghiêm chỉnh nội quy trường lớp."
              </p>
            </div>
          </div>
        </div>

        {/* School Announcements with "Tôi đã đọc" acknowledgment */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Thông báo gửi phụ huynh</h3>
            </div>

            <div className="space-y-3">
              {announcements.map((anc) => {
                const isRead = acknowledgedIds.has(anc.id);
                return (
                  <div
                    key={anc.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{anc.author_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(anc.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900">{anc.title}</h4>
                    <p className="text-slate-600 line-clamp-3 leading-relaxed">{anc.content}</p>

                    <div className="pt-2 flex justify-end">
                      {isRead ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã xác nhận "Tôi đã đọc"
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(anc.id)}
                          className="px-3 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                        >
                          Xác nhận "Tôi đã đọc"
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
