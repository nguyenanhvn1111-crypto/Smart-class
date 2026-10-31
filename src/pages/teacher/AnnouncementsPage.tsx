import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { useClass } from '../../contexts/ClassContext';
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'parents' | 'students'>('class');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

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
      author_id: 'user-teacher-1',
      author_name: 'Cô Trần Thị Mai',
      author_role: 'teacher',
      title,
      content,
      target_type: targetType,
      target_id: targetType === 'class' ? selectedClassId : undefined,
      target_name: targetType === 'class' ? '10A1 - Chuyên Toán' : undefined,
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thông báo & Tin nhắn Nhà trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gửi thông báo tới toàn trường, từng lớp, học sinh hoặc gửi trực tiếp tới điện thoại phụ huynh
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs self-start sm:self-auto active:scale-95"
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
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    anc.priority === 'urgent'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : anc.priority === 'important'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {anc.priority === 'urgent'
                    ? 'Khẩn cấp'
                    : anc.priority === 'important'
                    ? 'Quan trọng'
                    : 'Thông thường'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Gửi tới: <strong className="text-slate-800">{anc.target_name || anc.target_type}</strong>
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
              <h3 className="text-base font-bold text-slate-900">{anc.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 whitespace-pre-line leading-relaxed">
                {anc.content}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
              <span>Đăng bởi: <strong className="text-slate-700">{anc.author_name}</strong></span>
              <button
                onClick={() => alert(`Xem danh sách chi tiết các phụ huynh đã mở thông báo`)}
                className="text-blue-600 hover:text-blue-700 font-semibold"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề thông báo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kế hoạch kiểm tra định kỳ học kỳ 1"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đối tượng tiếp nhận
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              >
                <option value="class">Chỉ lớp đang chọn (10A1)</option>
                <option value="parents">Chỉ gửi cho Phụ huynh</option>
                <option value="students">Chỉ gửi cho Học sinh</option>
                <option value="all">Toàn thể học sinh & phụ huynh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              >
                <option value="normal">Thông thường</option>
                <option value="important">Quan trọng</option>
                <option value="urgent">Khẩn cấp (Yêu cầu xác nhận)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung thông báo *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung đầy đủ của thông báo..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Phát hành thông báo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
