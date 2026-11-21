import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { Announcement } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Megaphone,
  Plus,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Paperclip,
  Eye,
  AlertCircle
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const { user, role } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'parents' | 'students'>('class');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const loadAnnouncements = async () => {
    const list = await DataService.getAnnouncements();
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
    const unsub = DataService.subscribe(loadAnnouncements);
    return unsub;
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await DataService.createAnnouncement({
      school_id: 'sch-001',
      author_id: user?.id || 'user-teacher-1',
      author_name: user?.full_name || 'Cô Trần Thị Mai',
      author_role: role === 'admin' ? 'admin' : 'teacher',
      title: title.trim(),
      content: content.trim(),
      target_type: targetType,
      target_id: targetType === 'class' ? selectedClassId : undefined,
      target_name: targetType === 'class' ? selectedClass?.name || '10A1' : undefined,
      priority,
      is_published: true
    });

    setIsModalOpen(false);
    setTitle('');
    setContent('');
    loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Thông báo & Tin nhắn Nhà trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gửi thông báo tới toàn trường, từng lớp, học sinh hoặc gửi trực tiếp tới điện thoại phụ huynh
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs self-start sm:self-auto active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo thông báo mới</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    anc.priority === 'urgent'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : anc.priority === 'important'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {anc.priority === 'urgent'
                    ? 'Khẩn cấp'
                    : anc.priority === 'important'
                    ? 'Quan trọng'
                    : 'Thông thường'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Gửi tới: <strong className="text-slate-800 dark:text-slate-200">{anc.target_name || anc.target_type}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {anc.read_count}/{anc.total_recipients} đã đọc
                </span>
                <span>{new Date(anc.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{anc.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
                {anc.content}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span>Đăng bởi: <strong className="text-slate-700 dark:text-slate-200">{anc.author_name}</strong></span>
              <button
                type="button"
                onClick={() => setViewAnnouncement(anc)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
              >
                Chi tiết lượt xem →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Soạn thông báo mới"
        subtitle="Thông báo sẽ được đẩy tới cổng học sinh và cổng phụ huynh"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề thông báo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kế hoạch kiểm tra định kỳ học kỳ 1"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đối tượng tiếp nhận
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-hidden"
              >
                <option value="class">Chỉ lớp đang chọn ({selectedClass?.name || '10A1'})</option>
                <option value="parents">Chỉ gửi cho Phụ huynh</option>
                <option value="students">Chỉ gửi cho Học sinh</option>
                <option value="all">Toàn thể học sinh & phụ huynh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-hidden"
              >
                <option value="normal">Thông thường</option>
                <option value="important">Quan trọng</option>
                <option value="urgent">Khẩn cấp (Yêu cầu xác nhận)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nội dung thông báo *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung đầy đủ của thông báo..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              Phát hành thông báo
            </button>
          </div>
        </form>
      </Modal>

      {/* Viewer Details Modal */}
      <Modal
        isOpen={Boolean(viewAnnouncement)}
        onClose={() => setViewAnnouncement(null)}
        title="Thống kê lượt xem thông báo"
        subtitle={viewAnnouncement?.title}
        maxWidth="md"
      >
        {viewAnnouncement && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Tổng người nhận</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {viewAnnouncement.total_recipients || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-300 block">Đã mở xem</span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {viewAnnouncement.read_count || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <span className="text-amber-700 dark:text-amber-300 block">Chưa xem</span>
                <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                  {Math.max(0, (viewAnnouncement.total_recipients || 0) - (viewAnnouncement.read_count || 0))}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Đối tượng nhận:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {viewAnnouncement.target_name || viewAnnouncement.target_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Người phát hành:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{viewAnnouncement.author_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Thời gian gửi:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {new Date(viewAnnouncement.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tỷ lệ đã đọc:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {viewAnnouncement.total_recipients
                    ? Math.round(((viewAnnouncement.read_count || 0) / viewAnnouncement.total_recipients) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewAnnouncement(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
