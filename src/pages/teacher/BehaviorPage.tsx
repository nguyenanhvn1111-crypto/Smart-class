import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Student, BehaviorRecord, RewardBadge } from '../../types';
import { Modal } from '../../components/common/Modal';
import confetti from 'canvas-confetti';
import {
  Award,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Star,
  Plus,
  Shield,
  Medal,
  Heart,
  Zap,
  TrendingUp,
  History
} from 'lucide-react';

export const BehaviorPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const [students, setStudents] = useState<Student[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [rewards, setRewards] = useState<RewardBadge[]>([]);

  // Add behavior modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [type, setType] = useState<'positive' | 'need_improvement'>('positive');
  const [points, setPoints] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    const stus = await DataService.getStudents(selectedClassId);
    const behs = await DataService.getBehaviorRecords(selectedClassId);
    const rws = await DataService.getRewards();
    setStudents(stus);
    setBehaviorRecords(behs);
    setRewards(rws);
    if (stus.length > 0 && !selectedStudentId) {
      setSelectedStudentId(stus[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, [selectedClassId]);

  const handleSaveBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedStudentId) return;

    const stu = students.find((s) => s.id === selectedStudentId);
    const adjustedPoints = type === 'positive' ? Math.abs(points) : -Math.abs(points);

    await DataService.addBehaviorRecord({
      class_id: selectedClassId,
      student_id: selectedStudentId,
      student_name: stu?.full_name || '',
      teacher_id: 'user-teacher-1',
      teacher_name: 'Cô Trần Thị Mai',
      type,
      points: adjustedPoints,
      title,
      description
    });

    if (type === 'positive') {
      confetti({ particleCount: 70, spread: 60 });
    }

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hành vi & Thi đua Lớp học
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận điểm thưởng rèn luyện, trao huy hiệu danh dự và ghi chép nhắc nhở kỷ luật
          </p>
        </div>

        <button
          onClick={() => {
            setType('positive');
            setPoints(5);
            setTitle('Hăng hái phát biểu xây dựng bài');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận rèn luyện</span>
        </button>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {students.slice(0, 3).map((stu, rank) => (
          <div
            key={stu.id}
            className={`p-6 rounded-3xl border shadow-xs relative overflow-hidden ${
              rank === 0
                ? 'bg-linear-to-b from-amber-50 to-white border-amber-200'
                : rank === 1
                ? 'bg-linear-to-b from-slate-100 to-white border-slate-200'
                : 'bg-linear-to-b from-orange-50 to-white border-orange-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs ${
                  rank === 0
                    ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-100'
                    : rank === 1
                    ? 'bg-slate-300 text-slate-800 ring-4 ring-slate-100'
                    : 'bg-orange-300 text-orange-950 ring-4 ring-orange-100'
                }`}
              >
                #{rank + 1}
              </span>
              <Trophy
                className={`w-6 h-6 ${
                  rank === 0 ? 'text-amber-500' : rank === 1 ? 'text-slate-400' : 'text-orange-400'
                }`}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <img
                src={stu.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={stu.full_name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
              />
              <div>
                <h3 className="font-bold text-slate-900">{stu.full_name}</h3>
                <p className="text-xs text-slate-400">{stu.student_code}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Điểm rèn luyện:</span>
              <span className="font-extrabold text-blue-600 text-base">{stu.behavior_score}đ</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Behavior Logs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Nhật ký rèn luyện gần đây</h3>
        <div className="space-y-2.5">
          {behaviorRecords.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                rec.type === 'positive'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    rec.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {rec.type === 'positive' ? (
                    <ThumbsUp className="w-4 h-4" />
                  ) : (
                    <ThumbsDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{rec.title}</h4>
                  <p className="text-slate-500 mt-0.5">
                    Học sinh: <strong className="text-slate-800">{rec.student_name}</strong> •{' '}
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`font-extrabold text-sm ${
                    rec.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {rec.points > 0 ? `+${rec.points}` : rec.points} điểm
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {new Date(rec.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Behavior Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ghi nhận rèn luyện / Khen thưởng"
        subtitle="Cộng hoặc trừ điểm thi đua của học sinh"
      >
        <form onSubmit={handleSaveBehavior} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn học sinh</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.student_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('positive')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'positive'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Khen thưởng (+ Điểm)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('need_improvement')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'need_improvement'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Nhắc nhở (- Điểm)</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hành vi / Lý do</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đạt điểm cao trong bài kiểm tra 15 phút"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số điểm thưởng/phạt</label>
            <input
              type="number"
              min={1}
              max={20}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-32 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-bold outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chi tiết bổ sung</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú cụ thể..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-hidden"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Lưu ghi nhận
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
