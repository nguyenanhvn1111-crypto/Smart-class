import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { ClassModel } from '../../types';
import { SearchBox } from '../../components/common/SearchBox';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Copy,
  Check,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Eye,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LayoutDashboard,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export const ClassList: React.FC = () => {
  const { classes, refreshClasses, setSelectedClassId } = useClass();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'my-classes' | 'create-class'
  const isCreateRoute = location.pathname.endsWith('/create');
  const [activeTab, setActiveTab] = useState<'my-classes' | 'create-class'>(
    isCreateRoute ? 'create-class' : 'my-classes'
  );

  // Sync tab with URL if navigation changes
  useEffect(() => {
    const target = location.pathname.endsWith('/create') ? 'create-class' : 'my-classes';
    setActiveTab((prev) => (prev !== target ? target : prev));
  }, [location.pathname]);

  // Tab 1 (Lớp của tôi) States
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Expandable "Không gian làm việc chính" state per class
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});

  const toggleWorkspace = (classId: string) => {
    setExpandedWorkspaces((prev) => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassModel | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    room: '',
    grade_level_id: 'gr-10',
    academic_year_id: 'ay-2025',
    status: 'active' as 'active' | 'archived' | 'completed',
    homeroom_teacher_name: ''
  });

  // Confirm Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tab 2 (Thêm mới lớp) Form States
  const generateNewJoinCode = () => 'SMART' + Math.floor(1000 + Math.random() * 9000);

  const [createFormData, setCreateFormData] = useState({
    name: '',
    grade_level_id: 'gr-10',
    academic_year_id: 'ay-2025',
    room: '',
    homeroom_teacher_name: 'Cô Trần Thị Mai',
    status: 'active' as 'active' | 'archived' | 'completed',
    join_code: generateNewJoinCode(),
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered classes for Tab 1
  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.join_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.room && c.room.toLowerCase().includes(search.toLowerCase())) ||
      (c.homeroom_teacher_name && c.homeroom_teacher_name.toLowerCase().includes(search.toLowerCase()));
    const matchGrade = selectedGrade === 'all' || c.grade_level_id === selectedGrade;
    const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchSearch && matchGrade && matchStatus;
  });

  // Copy Join Code helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Switch Tab Handler
  const handleTabChange = (tabId: 'my-classes' | 'create-class') => {
    setActiveTab(tabId);
    if (tabId === 'create-class') {
      const basePath = location.pathname.startsWith('/admin') ? '/admin/classes' : '/teacher/classes';
      navigate(`${basePath}/create`, { replace: true });
    } else {
      const basePath = location.pathname.startsWith('/admin') ? '/admin/classes' : '/teacher/classes';
      navigate(basePath, { replace: true });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (cls: ClassModel) => {
    setEditingClass(cls);
    setEditFormData({
      name: cls.name,
      room: cls.room || '',
      grade_level_id: cls.grade_level_id,
      academic_year_id: cls.academic_year_id,
      status: cls.status,
      homeroom_teacher_name: cls.homeroom_teacher_name || 'Cô Trần Thị Mai'
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editFormData.name.trim()) return;

    await DataService.updateClass(editingClass.id, {
      name: editFormData.name.trim(),
      room: editFormData.room.trim(),
      grade_level_id: editFormData.grade_level_id,
      status: editFormData.status,
      homeroom_teacher_name: editFormData.homeroom_teacher_name.trim()
    });

    await refreshClasses();
    setIsEditModalOpen(false);
    setEditingClass(null);
    setSuccessMessage(`Đã cập nhật thông tin lớp ${editFormData.name} thành công!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Submit Tab 2: Thêm mới lớp
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!createFormData.name.trim()) {
      errors.name = 'Vui lòng nhập tên lớp học (ví dụ: 10A3 - Chuyên Hóa)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const newClass = await DataService.createClass({
        name: createFormData.name.trim(),
        room: createFormData.room.trim() || undefined,
        school_id: 'sch-001',
        academic_year_id: createFormData.academic_year_id,
        grade_level_id: createFormData.grade_level_id,
        status: createFormData.status,
        homeroom_teacher_name: createFormData.homeroom_teacher_name.trim() || 'Cô Trần Thị Mai'
      });

      await refreshClasses();
      setSelectedClassId(newClass.id);

      // Reset form
      setCreateFormData({
        name: '',
        grade_level_id: 'gr-10',
        academic_year_id: 'ay-2025',
        room: '',
        homeroom_teacher_name: 'Cô Trần Thị Mai',
        status: 'active',
        join_code: generateNewJoinCode(),
        notes: ''
      });

      // Switch to Tab 1 (Lớp của tôi) and show success banner
      handleTabChange('my-classes');
      setSuccessMessage(`Tạo mới lớp học "${newClass.name}" thành công! Lớp đã được thêm vào danh sách.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error creating class:', err);
      setFormErrors({ submit: 'Có lỗi xảy ra khi tạo lớp. Vui lòng thử lại!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Tab 2 form
  const handleResetCreateForm = () => {
    setCreateFormData({
      name: '',
      grade_level_id: 'gr-10',
      academic_year_id: 'ay-2025',
      room: '',
      homeroom_teacher_name: 'Cô Trần Thị Mai',
      status: 'active',
      join_code: generateNewJoinCode(),
      notes: ''
    });
    setFormErrors({});
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteId) return;
    await DataService.deleteClass(deleteId);
    await refreshClasses();
    setDeleteId(null);
    setSuccessMessage('Đã xóa lớp học thành công.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Grade badge labels
  const getGradeName = (gradeId: string) => {
    switch (gradeId) {
      case 'gr-10':
        return 'Khối 10';
      case 'gr-11':
        return 'Khối 11';
      case 'gr-12':
        return 'Khối 12';
      default:
        return 'Khối 10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Lớp học</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Quản lý các lớp học được phân công giảng dạy, sĩ số và tạo mới lớp học số
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TWO PRIMARY TABS */}
      <div className="border-b border-slate-200 bg-white px-2 pt-2 rounded-2xl shadow-2xs">
        <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
          {/* TAB 1: LỚP CỦA TÔI */}
          <button
            type="button"
            onClick={() => handleTabChange('my-classes')}
            className={`flex items-center gap-2.5 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
              activeTab === 'my-classes'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'my-classes' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Lớp của tôi</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                activeTab === 'my-classes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {classes.length}
            </span>
          </button>

          {/* TAB 2: THÊM MỚI LỚP */}
          <button
            type="button"
            onClick={() => handleTabChange('create-class')}
            className={`flex items-center gap-2.5 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
              activeTab === 'create-class'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Plus className={`w-4 h-4 ${activeTab === 'create-class' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Thêm mới lớp</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase transition-colors ${
                activeTab === 'create-class'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              Mới
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 1: LỚP CỦA TÔI */}
      {/* ========================================================================= */}
      {activeTab === 'my-classes' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Filter and View toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Tìm theo tên lớp, phòng, mã tham gia..."
                className="flex-1 min-w-[220px] max-w-md"
              />

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Tất cả khối lớp</option>
                <option value="gr-10">Khối 10</option>
                <option value="gr-11">Khối 11</option>
                <option value="gr-12">Khối 12</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="archived">Đã lưu trữ</option>
                <option value="completed">Đã kết thúc</option>
              </select>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng lưới thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng bảng dữ liệu"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Classes Grid View */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {search || selectedGrade !== 'all' || selectedStatus !== 'all'
                  ? 'Không có lớp học nào phù hợp với bộ lọc hiện tại. Vui lòng thử tìm kiếm lại.'
                  : 'Bạn chưa tạo lớp học nào. Hãy bấm sang tab "Thêm mới lớp" để bắt đầu!'}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {(search || selectedGrade !== 'all' || selectedStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedGrade('all');
                      setSelectedStatus('all');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTabChange('create-class')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm mới lớp ngay</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-blue-500/20 shrink-0">
                          {cls.name.substring(0, 3).replace('-', '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Đã bỏ badge Khối lớp (Khối 10, Khối 11) theo viền đỏ */}
                          <h3
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              navigate(`/teacher/classes/${cls.id}`);
                            }}
                            className="font-bold text-base text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors whitespace-nowrap truncate"
                            title={cls.name}
                          >
                            {cls.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Đã bỏ badge Trạng thái (Đang hoạt động) theo viền đỏ */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(cls.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa lớp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Hoán đổi vị trí: GVCN lên trên, Sĩ số & Phòng học xuống dưới (theo mũi tên đỏ) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      {/* Dòng 1 (trên): GVCN */}
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate text-slate-500">
                          GVCN: <span className="text-slate-800 font-semibold">{cls.homeroom_teacher_name || 'Cô Trần Thị Mai'}</span>
                        </span>
                      </div>

                      {/* Dòng 2 (dưới): Sĩ số học sinh và Số phòng học */}
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            <strong>{cls.student_count}</strong> học sinh
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cls.room || 'Chưa xếp phòng'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bấm vào Không gian làm việc chính thì vào thẳng toàn bộ không gian làm việc luôn */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          navigate(`/teacher/classes/${cls.id}`);
                        }}
                        className="w-full p-2.5 rounded-xl bg-blue-50/90 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 hover:border-blue-600 transition-all cursor-pointer group/ws flex items-center justify-between shadow-2xs hover:shadow-xs"
                        title="Bấm để vào thẳng toàn bộ Không gian làm việc của lớp"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-blue-600 group-hover/ws:text-white transition-colors" />
                          <span className="font-bold text-xs sm:text-sm tracking-tight">
                            Không gian làm việc chính
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover/ws:text-white transition-colors">
                          <span>Vào ngay</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/ws:translate-x-0.5" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Đã bỏ 2 nút Điểm danh và Chi tiết lớp ở dưới cùng theo viền đỏ */}
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5">Tên lớp</th>
                      <th className="px-4 py-3.5">Khối lớp</th>
                      <th className="px-4 py-3.5">Phòng học</th>
                      <th className="px-4 py-3.5">GV Chủ nhiệm</th>
                      <th className="px-4 py-3.5">Sĩ số</th>
                      <th className="px-4 py-3.5">Mã tham gia</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map((cls) => {
                      const isExpanded = Boolean(expandedWorkspaces[cls.id]);
                      return (
                        <React.Fragment key={cls.id}>
                          <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-blue-50/40' : ''}`}>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">
                              <div className="flex flex-col items-start gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClassId(cls.id);
                                    navigate(`/teacher/classes/${cls.id}`);
                                  }}
                                  className="text-blue-600 hover:underline font-bold text-left cursor-pointer"
                                >
                                  {cls.name}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClassId(cls.id);
                                    navigate(`/teacher/classes/${cls.id}`);
                                  }}
                                  className="text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-colors bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                                  title="Vào thẳng toàn bộ Không gian làm việc của lớp"
                                >
                                  <LayoutDashboard className="w-3 h-3" />
                                  <span>Không gian làm việc chính</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{getGradeName(cls.grade_level_id)}</td>
                            <td className="px-4 py-3.5 text-slate-600">{cls.room || 'Chưa xếp'}</td>
                            <td className="px-4 py-3.5 text-slate-600">{cls.homeroom_teacher_name || 'Cô Trần Thị Mai'}</td>
                            <td className="px-4 py-3.5 text-slate-700 font-semibold">{cls.student_count} học sinh</td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                {cls.join_code}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <StatusChip status={cls.status} size="sm" />
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClassId(cls.id);
                                  navigate(`/teacher/classes/${cls.id}`);
                                }}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Vào workspace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(cls)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(cls.id)}
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Workspace Row */}
                          {isExpanded && (
                            <tr className="bg-blue-50/30">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-3.5 animate-in fade-in duration-150">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                        <LayoutDashboard className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-900">
                                          Không gian làm việc chính - Lớp {cls.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                          Phòng: <strong className="text-slate-700">{cls.room || 'P201'}</strong> • GVCN:{' '}
                                          <strong className="text-slate-700">{cls.homeroom_teacher_name || 'Cô Trần Thị Mai'}</strong> • Sĩ số:{' '}
                                          <strong className="text-blue-600">{cls.student_count} học sinh</strong>
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        navigate(`/teacher/classes/${cls.id}`);
                                      }}
                                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>Vào trang Không gian làm việc đầy đủ</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Fast Actions in Workspace */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        navigate('/teacher/attendance');
                                      }}
                                      className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-slate-700 hover:text-emerald-700"
                                    >
                                      <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <div className="text-left">
                                        <span className="block font-bold">Điểm danh</span>
                                        <span className="text-[10px] text-slate-400 block font-normal">Sĩ số & đi muộn</span>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        navigate('/teacher/assignments/create');
                                      }}
                                      className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-slate-700 hover:text-blue-700"
                                    >
                                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                      <div className="text-left">
                                        <span className="block font-bold">Giao bài tập</span>
                                        <span className="text-[10px] text-slate-400 block font-normal">Tạo bài mới</span>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        navigate('/teacher/grades');
                                      }}
                                      className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-100 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-slate-700 hover:text-purple-700"
                                    >
                                      <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
                                      <div className="text-left">
                                        <span className="block font-bold">Sổ điểm số</span>
                                        <span className="text-[10px] text-slate-400 block font-normal">Nhập điểm định kỳ</span>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassId(cls.id);
                                        navigate('/teacher/schedule');
                                      }}
                                      className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-100 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-slate-700 hover:text-amber-700"
                                    >
                                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                                      <div className="text-left">
                                        <span className="block font-bold">Thời khóa biểu</span>
                                        <span className="text-[10px] text-slate-400 block font-normal">Lịch học hàng tuần</span>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 2: THÊM MỚI LỚP */}
      {/* ========================================================================= */}
      {activeTab === 'create-class' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Create Class Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Thông tin khởi tạo lớp học</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Điền các thông tin để thiết lập lớp học mới cho năm học hiện tại
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Bước 1 / 1
                </span>
              </div>

              {formErrors.submit && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-5">
                {/* Tên lớp học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) => {
                      setCreateFormData({ ...createFormData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    placeholder="VD: 10A3 - Chuyên Hóa hoặc 11B2 - Tự Nhiên"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all ${
                      formErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{formErrors.name}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gợi ý: Đặt tên bao gồm khối và phân ban để học sinh và phụ huynh dễ nhận diện.
                  </p>
                </div>

                {/* Khối lớp & Năm học */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Khối lớp *</label>
                    <select
                      value={createFormData.grade_level_id}
                      onChange={(e) => setCreateFormData({ ...createFormData, grade_level_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                    >
                      <option value="gr-10">Khối 10 (Lớp 10)</option>
                      <option value="gr-11">Khối 11 (Lớp 11)</option>
                      <option value="gr-12">Khối 12 (Lớp 12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Năm học *</label>
                    <select
                      value={createFormData.academic_year_id}
                      onChange={(e) => setCreateFormData({ ...createFormData, academic_year_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                    >
                      <option value="ay-2025">Năm học 2025 - 2026 (Hiện tại)</option>
                      <option value="ay-2024">Năm học 2024 - 2025</option>
                    </select>
                  </div>
                </div>

                {/* Phòng học & Giáo viên chủ nhiệm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phòng học cố định
                    </label>
                    <input
                      type="text"
                      value={createFormData.room}
                      onChange={(e) => setCreateFormData({ ...createFormData, room: e.target.value })}
                      placeholder="VD: P304 - Tòa nhà A"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giáo viên chủ nhiệm
                    </label>
                    <input
                      type="text"
                      value={createFormData.homeroom_teacher_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, homeroom_teacher_name: e.target.value })}
                      placeholder="VD: Cô Trần Thị Mai"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Mã tham gia lớp & Trạng thái */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Mã tham gia lớp</label>
                      <button
                        type="button"
                        onClick={() => setCreateFormData({ ...createFormData, join_code: generateNewJoinCode() })}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Đổi mã</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={createFormData.join_code}
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-hidden cursor-default"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-medium">Tự động</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Trạng thái khởi tạo</label>
                    <select
                      value={createFormData.status}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          status: e.target.value as 'active' | 'archived' | 'completed'
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                    >
                      <option value="active">Đang hoạt động (Mặc định)</option>
                      <option value="archived">Lưu trữ / Đang chuẩn bị</option>
                    </select>
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ghi chú / Mục tiêu của lớp (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                    placeholder="VD: Lớp định hướng thi học sinh giỏi cấp Thành phố, chuyên đề học sâu..."
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetCreateForm}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Làm lại form
                  </button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleTabChange('my-classes')}
                      className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang lưu lớp...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Tạo lớp học ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Real-time Live Preview Card & Guidance */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card Preview Header */}
              <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-700/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Xem trước thẻ lớp học
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/20">
                    Live Preview
                  </span>
                </div>

                {/* Mock Card Preview */}
                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {(createFormData.name || 'Lớp mới').substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                          {getGradeName(createFormData.grade_level_id)}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                          {createFormData.name || 'Tên lớp học mới'}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{createFormData.room || 'Chưa xếp phòng'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>0 học sinh</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 text-slate-500">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        GVCN: <strong className="text-slate-700">{createFormData.homeroom_teacher_name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Mã: <strong>{createFormData.join_code}</strong>
                    </span>
                    <span className="text-blue-600 font-semibold text-[11px]">Sẵn sàng</span>
                  </div>
                </div>
              </div>

              {/* Instructions / Best Practices Box */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wide text-blue-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Hướng dẫn quản lý lớp học số
                </h3>
                <ul className="text-xs text-blue-800/90 space-y-2 list-disc list-inside">
                  <li>
                    Sau khi tạo lớp, giáo viên có thể vào mục <strong>Hồ sơ 360°</strong> để thêm từng học sinh hoặc <strong>Import danh sách từ file Excel</strong>.
                  </li>
                  <li>
                    Mỗi lớp học sở hữu <strong>Mã tham gia</strong> duy nhất để học sinh và phụ huynh liên kết tài khoản.
                  </li>
                  <li>
                    Hệ thống tự động kích hoạt <strong>Sổ điểm Spreadsheet</strong> và <strong>Điểm danh điện tử</strong> ngay sau khi lớp được tạo.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK EDIT CLASS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin lớp"
        subtitle="Cập nhật các thông tin của lớp học hiện tại"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên lớp học *
            </label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={editFormData.grade_level_id}
                onChange={(e) => setEditFormData({ ...editFormData, grade_level_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                <option value="gr-10">Khối 10</option>
                <option value="gr-11">Khối 11</option>
                <option value="gr-12">Khối 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng học</label>
              <input
                type="text"
                value={editFormData.room}
                onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                placeholder="VD: P304 - Nhà A"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GV Chủ nhiệm</label>
              <input
                type="text"
                value={editFormData.homeroom_teacher_name}
                onChange={(e) => setEditFormData({ ...editFormData, homeroom_teacher_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as 'active' | 'archived' | 'completed'
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                <option value="active">Đang hoạt động</option>
                <option value="archived">Lưu trữ</option>
                <option value="completed">Đã kết thúc</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa lớp học"
        message="Bạn có chắc chắn muốn xóa lớp học này? Toàn bộ danh sách học sinh và dữ liệu điểm danh sẽ bị loại khỏi lớp."
        confirmLabel="Xóa vĩnh viễn"
        isDestructive={true}
      />
    </div>
  );
};
