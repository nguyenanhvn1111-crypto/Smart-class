import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { aiAssistant } from '../../services/aiService';
import {
  FileText,
  Calendar,
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
  Paperclip,
  Upload,
  AlertCircle,
  X
} from 'lucide-react';

const SUBJECT_NAMES: Record<string, string> = {
  'sub-math': 'Toán Học',
  'sub-lit': 'Ngữ Văn',
  'sub-eng': 'Tiếng Anh',
  'sub-phys': 'Vật Lý'
};

const DRAFT_KEY = 'smartclass_assignment_draft';

export const AssignmentCreate: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState(selectedClassId || 'cls-10a1');
  const [subjectId, setSubjectId] = useState('sub-math');
  const [dueDate, setDueDate] = useState('2026-10-12T23:59');
  const [pointsMax, setPointsMax] = useState(10);
  const [allowLate, setAllowLate] = useState(true);
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Restore draft if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setTitle(d.title || '');
        setDescription(d.description || '');
        if (d.classId) setClassId(d.classId);
        if (d.subjectId) setSubjectId(d.subjectId);
      }
    } catch {}
  }, []);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (!title && !description) return;
    const interval = setInterval(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, description, classId, subjectId, dueDate })
      );
      setDraftSavedTime(new Date().toLocaleTimeString('vi-VN'));
    }, 5000);
    return () => clearInterval(interval);
  }, [title, description, classId, subjectId, dueDate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`
    }));
    setAttachments((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    setFormError(null);
    try {
      const subjectName = SUBJECT_NAMES[subjectId] || 'Toán Học';
      const res = await aiAssistant.generateAssignment({
        subject: subjectName,
        topic: title || `Chuyên đề ${subjectName}`,
        gradeLevel: 'Khối 10',
        objectives: 'Rèn luyện kỹ năng giải bài tập trọng tâm và vận dụng thực tế'
      });
      if (res.title && !title) setTitle(res.title);
      setDescription(res.description);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }
    setFormError(null);

    const cls = classes.find((c) => c.id === classId);
    const subjectName = SUBJECT_NAMES[subjectId] || 'Toán Học';

    await DataService.createAssignment({
      class_id: classId,
      class_name: cls?.name || '10A1',
      subject_id: subjectId,
      subject_name: subjectName,
      teacher_id: user?.id || 'user-teacher-1',
      teacher_name: user?.full_name || 'Cô Trần Thị Mai',
      title: title.trim(),
      description,
      due_date: new Date(dueDate).toISOString(),
      points_max: Number(pointsMax),
      status,
      allow_late: allowLate,
      attachments: attachments.map(({ name, url }) => ({ name, url }))
    });

    localStorage.removeItem(DRAFT_KEY);
    navigate('/teacher/assignments');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Giao bài tập mới</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Soạn nội dung bài tập, thời hạn nộp bài và tiêu chí đánh giá
            </p>
          </div>
        </div>

        {draftSavedTime && (
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Tự động lưu nháp lúc {draftSavedTime}
          </span>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tiêu đề bài tập *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Bài tập tuần 6: Phương pháp toạ độ trong mặt phẳng"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
          />
        </div>

        {/* Target class, Subject, Due date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Giao cho lớp</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-hidden"
            >
              <option value="sub-math">Toán Học</option>
              <option value="sub-lit">Ngữ Văn</option>
              <option value="sub-eng">Tiếng Anh</option>
              <option value="sub-phys">Vật Lý</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hạn nộp bài (Deadline)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-hidden"
            />
          </div>
        </div>

        {/* Max points and allow late */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thang điểm tối đa
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={pointsMax}
              onChange={(e) => setPointsMax(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-hidden"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="allowLate"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm"
            />
            <label htmlFor="allowLate" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Cho phép nộp muộn sau thời hạn (có gắn nhãn nộp trễ)
            </label>
          </div>
        </div>

        {/* Description & AI Generator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Nội dung yêu cầu bài tập & tiêu chí chấm
            </label>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isAiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'AI đang soạn...' : 'AI gợi ý nội dung đề bài'}</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết câu hỏi, bài tập trong SGK hoặc yêu cầu trình bày..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
          />
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tài liệu đính kèm (File bài giảng, PDF hướng dẫn)
          </label>
          <label className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:border-blue-500 text-slate-500 text-xs transition-colors">
            <Upload className="w-4 h-4" />
            <span>Kéo thả file đính kèm hoặc nhấp để tải lên</span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((file, idx) => (
                <span
                  key={`${file.name}-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  {file.size && <span className="text-[10px] text-blue-500">({file.size})</span>}
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-blue-500 hover:text-rose-600 ml-1"
                    title="Gỡ tệp"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-95"
          >
            Giao bài ngay
          </button>
        </div>
      </div>
    </div>
  );
};
