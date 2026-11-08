import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/dataService';
import { LessonTopic, Question, TopicStatus } from '../../types';
import { MathRenderer } from '../../components/common/MathRenderer';
import { Modal } from '../../components/common/Modal';
import { TeachingDocumentModal } from '../../components/teacher/TeachingDocumentModal';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit3,
  Copy,
  Trash2,
  Archive,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  Send,
  Eye,
  Check,
  X,
  FileQuestion,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const TopicManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { classes, selectedClassId } = useClass();
  const { user, role } = useAuth();

  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Mục 3.1)
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>(selectedClassId || 'all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Form State: Thêm / Sửa chủ đề (Mục 3.2)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [formClassId, setFormClassId] = useState(selectedClassId || 'cls-10a1');
  const [formSubjectId, setFormSubjectId] = useState('sub-math');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<TopicStatus>('ready');
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formWarningDuplicate, setFormWarningDuplicate] = useState<string | null>(null);

  // Modal Chọn câu hỏi từ Ngân hàng (Mục 3.3)
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerDifficulty, setPickerDifficulty] = useState('all');
  const [pickerType, setPickerType] = useState('all');
  const [tempSelectedQIds, setTempSelectedQIds] = useState<string[]>([]);

  // Modal Xem chi tiết chủ đề
  const [detailTopic, setDetailTopic] = useState<LessonTopic | null>(null);

  // Modal Trang Word & Chế độ Giảng dạy (Teaching Document)
  const [teachingModalTopic, setTeachingModalTopic] = useState<LessonTopic | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    const [topicList, qList] = await Promise.all([
      DataService.getLessonTopics(),
      DataService.getQuestions()
    ]);
    setTopics(topicList);
    setQuestions(qList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Filtered topics (Mục 3.1)
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      // Permission check: nếu giáo viên thì chỉ xem các lớp được phân công
      if (role === 'teacher') {
        const teacherClassIds = classes.map((c) => c.id);
        if (!teacherClassIds.includes(t.class_id)) return false;
      }

      if (filterClass !== 'all' && t.class_id !== filterClass) return false;
      if (filterSubject !== 'all' && t.subject_id !== filterSubject) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterDate && t.session_date !== filterDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchContent = t.content.toLowerCase().includes(q);
        const matchClass = t.class_name.toLowerCase().includes(q);
        const matchSubject = t.subject_name.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchClass && !matchSubject) return false;
      }

      return true;
    });
  }, [topics, filterClass, filterSubject, filterStatus, filterDate, search, role, classes]);

  // Tính số câu trắc nghiệm & tự luận đủ điều kiện cho từng chủ đề (Mục 3.3)
  const getTopicEligibleCounts = (topic: LessonTopic) => {
    const res = DataService.getEligibleQuestionsForTopics([topic.id]);
    return {
      mcqCount: res.mcqEligible.length,
      essayCount: res.essayEligible.length,
      totalCount: res.allEligible.length
    };
  };

  // Open Create Form
  const handleOpenCreateForm = () => {
    setEditingTopicId(null);
    setFormClassId(selectedClassId || classes[0]?.id || 'cls-10a1');
    setFormSubjectId('sub-math');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormPeriod(1);
    setFormTitle('');
    setFormContent('');
    setFormStatus('ready');
    setFormQuestionIds([]);
    setFormErrors({});
    setFormWarningDuplicate(null);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (topic: LessonTopic) => {
    setEditingTopicId(topic.id);
    setFormClassId(topic.class_id);
    setFormSubjectId(topic.subject_id);
    setFormDate(topic.session_date);
    setFormPeriod(topic.period_number || 1);
    setFormTitle(topic.title);
    setFormContent(topic.content);
    setFormStatus(topic.status);
    setFormQuestionIds([...topic.question_ids]);
    setFormErrors({});
    setFormWarningDuplicate(null);
    setIsFormOpen(true);
  };

  // Duplicate Topic
  const handleDuplicateTopic = async (id: string) => {
    try {
      const duplicated = await DataService.duplicateLessonTopic(id);
      showToast('success', `Đã nhân bản chủ đề: "${duplicated.title}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Không thể sao chép chủ đề.');
    }
  };

  // Delete Topic (Mục 3.1: Chặn hoặc lưu trữ nếu đã được bài tập sử dụng)
  const handleDeleteTopic = async (topic: LessonTopic) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topic.title}"?`)) return;

    try {
      const res = await DataService.deleteLessonTopic(topic.id);
      if (res.success) {
        showToast('success', `Đã xóa chủ đề "${topic.title}".`);
      } else {
        showToast('error', res.message || 'Chủ đề đã được sử dụng nên được chuyển sang Lưu trữ.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xóa chủ đề.');
    }
  };

  // Save Quick Draft in row
  const handleQuickDraft = async (topic: LessonTopic) => {
    try {
      const newStatus: TopicStatus = topic.status === 'draft' ? 'ready' : 'draft';
      await DataService.updateLessonTopic(topic.id, { status: newStatus });
      showToast('success', `Chủ đề đã chuyển sang trạng thái: ${newStatus === 'draft' ? 'Bản nháp' : 'Đã hoàn thiện'}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  // Validation Form & Submit (Mục 3.2: Giới hạn 200 ký tự tên, 8.000 ký tự nội dung, kiểm tra trùng tên)
  const handleSubmitForm = async (e: React.FormEvent, forceStatus?: TopicStatus) => {
    e.preventDefault();
    const finalStatus = forceStatus || formStatus;
    const errors: { title?: string; content?: string } = {};

    if (!formTitle.trim()) {
      errors.title = 'Tên chủ đề là bắt buộc không được để trống.';
    } else if (formTitle.length > 200) {
      errors.title = `Tên chủ đề quá dài (${formTitle.length}/200 ký tự). Vui lòng rút gọn.`;
    }

    if (formContent.length > 8000) {
      errors.content = `Nội dung chủ đề vượt quá 8.000 ký tự (${formContent.length}/8.000 ký tự).`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Kiểm tra trùng tên theo lớp-môn-buổi
    const isDuplicate = topics.some(
      (t) =>
        t.id !== editingTopicId &&
        t.class_id === formClassId &&
        t.subject_id === formSubjectId &&
        t.session_date === formDate &&
        t.title.trim().toLowerCase() === formTitle.trim().toLowerCase()
    );

    if (isDuplicate && !formWarningDuplicate) {
      setFormWarningDuplicate(
        `Cảnh báo: Đã có chủ đề trùng tên "${formTitle}" trong cùng lớp, môn và buổi học này. Bấm "Lưu chủ đề" lần nữa nếu bạn chắc chắn muốn lưu.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const cls = classes.find((c) => c.id === formClassId);
      const subjName =
        formSubjectId === 'sub-math'
          ? 'Toán Học'
          : formSubjectId === 'sub-lit'
          ? 'Ngữ Văn'
          : formSubjectId === 'sub-eng'
          ? 'Tiếng Anh'
          : formSubjectId === 'sub-phys'
          ? 'Vật Lý'
          : 'Môn học';

      if (editingTopicId) {
        await DataService.updateLessonTopic(editingTopicId, {
          class_id: formClassId,
          class_name: cls?.name || '10A1',
          subject_id: formSubjectId,
          subject_name: subjName,
          session_date: formDate,
          period_number: formPeriod,
          title: formTitle.trim(),
          content: formContent,
          status: finalStatus,
          question_ids: formQuestionIds
        });
        showToast('success', `Đã cập nhật chủ đề "${formTitle}" thành công!`);
      } else {
        await DataService.createLessonTopic({
          class_id: formClassId,
          class_name: cls?.name || '10A1',
          subject_id: formSubjectId,
          subject_name: subjName,
          session_date: formDate,
          period_number: formPeriod,
          semester: 1,
          academic_year_id: 'ay-2025',
          title: formTitle.trim(),
          content: formContent,
          status: finalStatus,
          question_ids: formQuestionIds,
          created_by: user?.id || 'user-teacher-1',
          created_by_name: user?.full_name || 'Cô Trần Thị Mai'
        });
        showToast('success', `Đã tạo mới chủ đề "${formTitle}" thành công!`);
      }

      setIsFormOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi lưu chủ đề.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Question Picker Modal (Mục 3.3)
  const handleOpenQuestionPicker = () => {
    setTempSelectedQIds([...formQuestionIds]);
    setPickerSearch('');
    setPickerDifficulty('all');
    setPickerType('all');
    setIsQuestionPickerOpen(true);
  };

  // Apply Question Picker
  const handleApplyQuestionPicker = () => {
    setFormQuestionIds(tempSelectedQIds);
    setIsQuestionPickerOpen(false);
    showToast('success', `Đã gắn ${tempSelectedQIds.length} câu hỏi vào chủ đề hiện tại.`);
  };

  // Toggle selection in Question Picker
  const toggleSelectQuestionInPicker = (qid: string) => {
    setTempSelectedQIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  // Questions available in picker
  const pickerFilteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.status === 'archived') return false;
      if (q.subject_id !== formSubjectId) return false;
      if (pickerDifficulty !== 'all' && q.difficulty !== pickerDifficulty) return false;
      if (pickerType !== 'all' && q.question_type !== pickerType) return false;
      if (pickerSearch.trim()) {
        const kw = pickerSearch.toLowerCase().trim();
        return (
          q.question_text.toLowerCase().includes(kw) ||
          q.code?.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [questions, formSubjectId, pickerDifficulty, pickerType, pickerSearch]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/assignments')}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Giao bài tập</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              MÀN HÌNH 111
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Quản lý chủ đề bài học theo buổi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập chủ đề bài học, liên kết ngân hàng câu hỏi để sẵn sàng tạo bài tập về nhà và bài kiểm tra.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => navigate('/teacher/assignments/create-from-bank')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo bài tập từ ngân hàng</span>
          </button>

          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chủ đề mới</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters (Mục 3.1) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên chủ đề, nội dung..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Lớp:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Môn:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả môn học</option>
              <option value="sub-math">Toán Học</option>
              <option value="sub-lit">Ngữ Văn</option>
              <option value="sub-eng">Tiếng Anh</option>
              <option value="sub-phys">Vật Lý</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ready">Đã hoàn thiện</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Buổi học:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Hiển thị <b>{filteredTopics.length}</b> chủ đề phù hợp
          </span>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Xóa lọc ngày
            </button>
          )}
        </div>
      </div>

      {/* Topics Table (Mục 3.1) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table scroll indicator note */}
        <div className="px-5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Danh sách chủ đề bài học ({filteredTopics.length})</span>
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span>⇄ Kéo thanh trượt ngang để xem đầy đủ các cột</span>
          </span>
        </div>

        <div className="custom-horizontal-scrollbar p-1 pb-3">
          <table className="w-full text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4 whitespace-nowrap">#</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[280px]">Tên chủ đề bài học</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Lớp</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Môn học</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Buổi / Ngày</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Trắc nghiệm đủ ĐK</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Tự luận đủ ĐK</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Trạng thái</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Người tạo</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Cập nhật</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTopics.map((topic, idx) => {
                const { mcqCount, essayCount } = getTopicEligibleCounts(topic);
                const hasEligibleQuestions = mcqCount > 0 || essayCount > 0;

                return (
                  <tr key={topic.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-400 whitespace-nowrap">{idx + 1}</td>
                    
                    {/* Tên chủ đề bài học trên 1 dòng - rút gọn thông minh có tooltip đầy đủ */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="max-w-[300px] sm:max-w-[380px] lg:max-w-[440px]">
                        <button
                          onClick={() => setDetailTopic(topic)}
                          title={`${topic.title}${topic.content ? `\n\nNội dung tóm tắt: ${topic.content}` : ''}`}
                          className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors text-left truncate block whitespace-nowrap w-full cursor-pointer"
                        >
                          {topic.title}
                        </button>
                      </div>
                    </td>

                    {/* Lớp: 1 dòng */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold whitespace-nowrap inline-flex items-center">
                        {topic.class_name}
                      </span>
                    </td>

                    {/* Môn học: 1 dòng */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      <span className="whitespace-nowrap">{topic.subject_name}</span>
                    </td>

                    {/* Buổi / Ngày: 1 dòng */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">{new Date(topic.session_date).toLocaleDateString('vi-VN')}</span>
                        {topic.period_number && (
                          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">• Tiết {topic.period_number}</span>
                        )}
                      </div>
                    </td>

                    {/* Số câu trắc nghiệm đủ ĐK: 1 dòng */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs whitespace-nowrap shrink-0 ${
                          mcqCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {mcqCount} câu
                      </span>
                    </td>

                    {/* Số câu tự luận đủ ĐK: 1 dòng */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs whitespace-nowrap shrink-0 ${
                          essayCount > 0
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {essayCount} câu
                      </span>
                    </td>

                    {/* Trạng thái: icon + chữ trên 1 dòng */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {topic.status === 'ready' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">Đã hoàn thiện</span>
                        </span>
                      )}
                      {topic.status === 'draft' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">Bản nháp</span>
                        </span>
                      )}
                      {topic.status === 'archived' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap shrink-0">
                          <Archive className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">Lưu trữ</span>
                        </span>
                      )}
                    </td>

                    {/* Người tạo: 1 dòng */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium text-xs whitespace-nowrap">
                      {topic.created_by_name || 'Giáo viên'}
                    </td>

                    {/* Cập nhật: 1 dòng */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(topic.updated_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions: 1 dòng */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 whitespace-nowrap">
                        {/* Open Button: Mở giáo án dạng trang Word & Trình chiếu giảng dạy */}
                        <button
                          onClick={() => setTeachingModalTopic(topic)}
                          title="Open: Mở giáo án điện tử dạng Word & Chế độ Giảng dạy cho học sinh"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg shadow-2xs hover:shadow-sm transition-all active:scale-95 cursor-pointer mr-1 whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Open</span>
                        </button>

                        <button
                          onClick={() => setDetailTopic(topic)}
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditForm(topic)}
                          title="Chỉnh sửa chủ đề"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicateTopic(topic.id)}
                          title="Sao chép chủ đề"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleQuickDraft(topic)}
                          title={topic.status === 'draft' ? 'Đổi sang Đã hoàn thiện' : 'Lưu sang Bản nháp'}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTopic(topic)}
                          title="Xóa chủ đề"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTopics.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700">Chưa có chủ đề bài học nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bấm nút "Thêm chủ đề mới" để tạo bài học cho lớp của bạn.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: THÊM / SỬA CHỦ ĐỀ (MỤC 3.2 & 3.3) ================= */}
      {isFormOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          title={editingTopicId ? 'Chỉnh sửa chủ đề bài học (Màn hình 111)' : 'Thêm mới chủ đề bài học (Màn hình 111)'}
        >
          <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
            {formWarningDuplicate && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">{formWarningDuplicate}</span>
                  <p className="text-[11px] text-amber-700">
                    Bạn vẫn có thể tiếp tục lưu bằng cách nhấn nút "Lưu chủ đề" lần nữa.
                  </p>
                </div>
              </div>
            )}

            {/* Class, Subject, Date, Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.student_count} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Môn học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sub-math">Toán Học</option>
                  <option value="sub-lit">Ngữ Văn</option>
                  <option value="sub-eng">Tiếng Anh</option>
                  <option value="sub-phys">Vật Lý</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Buổi học / Ngày học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiết học trong thời khóa biểu
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Tên chủ đề (Mục 3.2: Max 200 ký tự, icon Thêm câu hỏi) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Tên chủ đề <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    formTitle.length > 200 ? 'text-rose-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {formTitle.length} / 200 ký tự
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={210}
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                  }}
                  placeholder="Nhập tên chủ đề bài học (Ví dụ: Hệ phương trình bậc nhất ba ẩn)..."
                  className={`w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={handleOpenQuestionPicker}
                  title="Thêm câu hỏi có sẵn từ ngân hàng"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formErrors.title && (
                <p className="text-rose-600 text-[11px] font-semibold mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Nội dung chủ đề (Mục 3.2: Max 8.000 ký tự, đếm ký tự, giữ xuống dòng) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Nội dung tóm tắt chủ đề</label>
                <span
                  className={`text-[11px] font-semibold ${
                    formContent.length > 8000 ? 'text-rose-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {formContent.length} / 8.000 ký tự
                </span>
              </div>
              <textarea
                rows={5}
                value={formContent}
                onChange={(e) => {
                  setFormContent(e.target.value);
                  if (formErrors.content) setFormErrors({ ...formErrors, content: undefined });
                }}
                placeholder="Nhập mục tiêu bài học, lý thuyết trọng tâm, các dạng bài tập, công thức..."
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 font-normal ${
                  formErrors.content ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {formErrors.content && (
                <p className="text-rose-600 text-[11px] font-semibold mt-1">{formErrors.content}</p>
              )}
            </div>

            {/* Trạng thái chủ đề */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/90">
              <span className="font-bold text-slate-700">Trạng thái:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="topicStatusRadio"
                  value="ready"
                  checked={formStatus === 'ready'}
                  onChange={() => setFormStatus('ready')}
                />
                <span className="font-semibold text-emerald-800">Đã hoàn thiện</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="topicStatusRadio"
                  value="draft"
                  checked={formStatus === 'draft'}
                  onChange={() => setFormStatus('draft')}
                />
                <span className="font-semibold text-amber-800">Bản nháp</span>
              </label>
            </div>

            {/* Quản lý câu hỏi thuộc chủ đề (Mục 3.3) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4 text-blue-600" />
                    <span>Câu hỏi gắn với chủ đề ({formQuestionIds.length} câu)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Câu hỏi được lấy từ ngân hàng câu hỏi dùng để tạo bài tập tự động hoặc thủ công.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenQuestionPicker}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn từ Ngân hàng câu hỏi</span>
                </button>
              </div>

              {/* Linked Questions List */}
              {formQuestionIds.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formQuestionIds.map((qid, qIdx) => {
                    const q = questions.find((item) => item.id === qid);
                    if (!q) return null;
                    const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';

                    return (
                      <div
                        key={qid}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">#{qIdx + 1}</span>
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                              {q.code || q.id}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isEssay
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                            </span>
                            <span className="text-slate-400 text-[10px]">{q.difficulty}</span>
                          </div>
                          <p className="font-semibold text-slate-800 line-clamp-1">
                            {q.question_text}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormQuestionIds(formQuestionIds.filter((id) => id !== qid))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Hủy liên kết câu hỏi này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
                  Chưa có câu hỏi nào được gắn. Bấm nút <b>"Chọn từ Ngân hàng câu hỏi"</b> ở trên để liên kết.
                </div>
              )}
            </div>

            {/* Action Buttons (Mục 3.2: Hủy, Lưu nháp, Lưu chủ đề, Thêm câu hỏi) */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmitForm(e, 'draft')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold transition-all"
                >
                  Lưu nháp
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu chủ đề'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: CHỌN CÂU HỎI TỪ NGÂN HÀNG (MỤC 3.3) ================= */}
      {isQuestionPickerOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsQuestionPickerOpen(false)}
          title={`Chọn câu hỏi từ Ngân hàng câu hỏi (${tempSelectedQIds.length} câu đã chọn)`}
        >
          <div className="space-y-4 text-xs">
            {/* Picker Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Tìm nội dung câu hỏi, mã câu..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              />

              <select
                value={pickerType}
                onChange={(e) => setPickerType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value="all">Tất cả loại câu</option>
                <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
                <option value="essay">Tự luận</option>
                <option value="short_answer">Điền ngắn</option>
              </select>

              <select
                value={pickerDifficulty}
                onChange={(e) => setPickerDifficulty(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <option value="all">Tất cả độ khó</option>
                <option value="nhan_biet">Nhận biết</option>
                <option value="thong_hieu">Thông hiểu</option>
                <option value="van_dung">Vận dụng</option>
                <option value="van_dung_cao">Vận dụng cao</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {pickerFilteredQuestions.map((q) => {
                const isSelected = tempSelectedQIds.includes(q.id);
                const isEssay = q.question_type === 'essay' || q.question_type === 'short_answer';

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelectQuestionInPicker(q.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectQuestionInPicker(q.id)}
                      className="mt-1 rounded text-blue-600"
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded text-[10px]">
                          {q.code || q.id}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isEssay ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Độ khó: {q.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.points || 1} điểm</span>
                      </div>

                      <div className="font-medium text-slate-800 text-xs line-clamp-2">
                        <MathRenderer content={q.question_text} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {pickerFilteredQuestions.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Không tìm thấy câu hỏi phù hợp trong ngân hàng câu hỏi môn này.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-600">
                Đã chọn: <b className="text-blue-600">{tempSelectedQIds.length}</b> câu hỏi
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionPickerOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyQuestionPicker}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Áp dụng vào chủ đề
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: XEM CHI TIẾT CHỦ ĐỀ ================= */}
      {detailTopic && (
        <Modal
          isOpen={true}
          onClose={() => setDetailTopic(null)}
          title={`Chi tiết chủ đề: ${detailTopic.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp & Môn học:</span>
                <span className="font-bold text-slate-900">
                  {detailTopic.class_name} • {detailTopic.subject_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buổi học:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(detailTopic.session_date).toLocaleDateString('vi-VN')} (Tiết {detailTopic.period_number || 1})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700">{detailTopic.status === 'ready' ? 'Đã hoàn thiện' : 'Bản nháp'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người tạo:</span>
                <span className="font-semibold text-slate-700">{detailTopic.created_by_name}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Nội dung tóm tắt:</span>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap leading-relaxed">
                {detailTopic.content}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">
                Câu hỏi liên kết ({detailTopic.question_ids?.length || 0} câu):
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(detailTopic.question_ids || []).map((qid) => {
                  const q = questions.find((item) => item.id === qid);
                  if (!q) return null;
                  return (
                    <div key={qid} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-mono font-bold text-blue-700 text-[10px] mr-2">
                        {q.code || q.id}
                      </span>
                      <span className="font-medium text-slate-800">{q.question_text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDetailTopic(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 text-xs"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  const t = detailTopic;
                  setDetailTopic(null);
                  setTeachingModalTopic(t);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mở trang Word & Giảng dạy (Open)</span>
              </button>

              <button
                onClick={() => {
                  const t = detailTopic;
                  setDetailTopic(null);
                  handleOpenEditForm(t);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Teaching Document Modal (Trang Word & Chế độ Giảng dạy) */}
      {teachingModalTopic && (
        <TeachingDocumentModal
          topic={teachingModalTopic}
          allQuestions={questions}
          isOpen={true}
          onClose={() => setTeachingModalTopic(null)}
          onTopicUpdated={(updated) => {
            setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setTeachingModalTopic(updated);
            showToast('success', 'Đã lưu và cập nhật nội dung giáo án thành công!');
          }}
        />
      )}
    </div>
  );
};
