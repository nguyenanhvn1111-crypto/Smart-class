import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataService } from '../../services/dataService';
import { useClass } from '../../contexts/ClassContext';
import { Student } from '../../types';
import { SearchBox } from '../../components/common/SearchBox';
import { StatusChip } from '../../components/common/StatusChip';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StudentProfileModal } from '../../components/student/StudentProfileModal';
import { ParentContactModal } from '../../components/parent/ParentContactModal';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Edit,
  Trash2,
  Phone,
  Mail,
  MoreHorizontal,
  ArrowRightLeft,
  Eye,
  Award,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  HeartHandshake,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Send,
  LayoutGrid,
  List
} from 'lucide-react';

export const StudentList: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();
  const navigate = useNavigate();
  const location = useLocation();

  // Route-based Tab Management: 'student-list' | 'parent-info' | 'create-student'
  const isCreateRoute = location.pathname.endsWith('/create');
  const [activeTab, setActiveTab] = useState<'student-list' | 'parent-info' | 'create-student'>(
    isCreateRoute ? 'create-student' : 'student-list'
  );

  useEffect(() => {
    if (location.pathname.endsWith('/create')) {
      setActiveTab('create-student');
    }
  }, [location.pathname]);

  const handleTabChange = (tabId: 'student-list' | 'parent-info' | 'create-student') => {
    setActiveTab(tabId);
    if (tabId === 'create-student') {
      navigate('/teacher/students/create', { replace: true });
    } else {
      navigate('/teacher/students', { replace: true });
    }
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>(selectedClassId || 'cls-10a1');
  const [filterGender, setFilterGender] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected student for 360° profile view
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<'student-info' | 'academic' | 'parent-info'>('student-info');
  const [parentViewMode, setParentViewMode] = useState<'table' | 'grid'>('table');

  const handleOpenParentDetail = (s: Student) => {
    setProfileInitialTab('parent-info');
    setProfileStudent(s);
  };

  const handleOpenStudentDetail = (s: Student) => {
    setProfileInitialTab('student-info');
    setProfileStudent(s);
  };

  // Parent contact modal state (matching Image 3)
  const [contactParentStudent, setContactParentStudent] = useState<Student | null>(null);
  const [searchParent, setSearchParent] = useState('');
  const [filterParentApp, setFilterParentApp] = useState<'all' | 'connected' | 'not_connected'>('all');
  const [copiedPhoneStudentId, setCopiedPhoneStudentId] = useState<string | null>(null);

  // Edit Parent modal state
  const [editingParentStudent, setEditingParentStudent] = useState<Student | null>(null);
  const [editParentFormData, setEditParentFormData] = useState({
    parent_name: '',
    parent_relationship: 'Bố',
    parent_phone: '',
    parent_email: '',
    parent_cmhs_role: '',
    app_connected: true
  });

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({
    student_code: '',
    full_name: '',
    email: '',
    phone: '',
    gender: 'male' as 'male' | 'female',
    date_of_birth: '2010-01-01',
    address: '',
    class_id: selectedClassId || 'cls-10a1',
    parent_name: '',
    parent_phone: ''
  });

  // Transfer class modal
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('cls-10a2');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Success message alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab 2: Thêm mới học sinh State
  const generateStudentCode = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HS${year}-${rand}`;
  };

  const [createFormData, setCreateFormData] = useState({
    student_code: generateStudentCode(),
    full_name: '',
    class_id: selectedClassId || 'cls-10a1',
    gender: 'male' as 'male' | 'female',
    date_of_birth: '2010-01-01',
    email: '',
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_relationship: 'Bố',
    parent_email: '',
    status: 'active' as 'active' | 'graduated' | 'suspended' | 'transferred',
    notes: ''
  });

  const [createAuthPassword, setCreateAuthPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadStudents = async () => {
    const list = await DataService.getStudents();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
    const unsub = DataService.subscribe(loadStudents);
    return unsub;
  }, []);

  // Filter students for Tab 1
  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.parent_name && s.parent_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.parent_phone && s.parent_phone.includes(search));

    const matchClass = filterClass === 'all' || s.class_id === filterClass;
    const matchGender = filterGender === 'all' || s.gender === filterGender;

    return matchSearch && matchClass && matchGender;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter parents for Tab 2
  const filteredParents = students.filter((s) => {
    const matchSearch =
      !searchParent.trim() ||
      (s.parent_name && s.parent_name.toLowerCase().includes(searchParent.toLowerCase())) ||
      s.full_name.toLowerCase().includes(searchParent.toLowerCase()) ||
      s.student_code.toLowerCase().includes(searchParent.toLowerCase()) ||
      (s.parent_phone && s.parent_phone.includes(searchParent));

    const matchClass = filterClass === 'all' || s.class_id === filterClass;
    const matchApp =
      filterParentApp === 'all'
        ? true
        : filterParentApp === 'connected'
        ? s.app_connected !== false
        : s.app_connected === false;

    return matchSearch && matchClass && matchApp;
  });

  // Metrics for Tab 2
  const classStudentsForMetrics = students.filter((s) => filterClass === 'all' || s.class_id === filterClass);
  const totalParents = classStudentsForMetrics.length;
  const fathersCount = classStudentsForMetrics.filter((s) => s.parent_relationship !== 'Mẹ').length;
  const mothersCount = totalParents - fathersCount;
  const connectedCount = classStudentsForMetrics.filter((s) => s.app_connected !== false).length;
  const connectedPercent = totalParents > 0 ? Math.round((connectedCount / totalParents) * 100) : 0;

  // Handlers for Parent Tab
  const handleOpenEditParent = (s: Student) => {
    setEditingParentStudent(s);
    setEditParentFormData({
      parent_name: s.parent_name || '',
      parent_relationship: s.parent_relationship || 'Bố',
      parent_phone: s.parent_phone || '',
      parent_email: s.parent_email || '',
      parent_cmhs_role: s.parent_cmhs_role || '',
      app_connected: s.app_connected !== false
    });
  };

  const handleSaveParentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParentStudent) return;
    await DataService.updateStudent(editingParentStudent.id, {
      ...editingParentStudent,
      parent_name: editParentFormData.parent_name.trim(),
      parent_relationship: editParentFormData.parent_relationship,
      parent_phone: editParentFormData.parent_phone.trim(),
      parent_email: editParentFormData.parent_email.trim(),
      parent_cmhs_role: editParentFormData.parent_cmhs_role,
      app_connected: editParentFormData.app_connected
    });
    setEditingParentStudent(null);
    await loadStudents();
    setSuccessMessage(`Đã cập nhật thông tin phụ huynh "${editParentFormData.parent_name}" thành công!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCopyPhone = (studentId: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneStudentId(studentId);
    setTimeout(() => setCopiedPhoneStudentId(null), 2000);
  };

  // Handle Edit Save (Modal)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFormData.full_name.trim() || !editFormData.student_code.trim()) return;

    const targetCls = classes.find((c) => c.id === editFormData.class_id);

    await DataService.updateStudent(editingStudent.id, {
      ...editFormData,
      class_name: targetCls?.name || '10A1'
    });

    setIsEditModalOpen(false);
    setEditingStudent(null);
    await loadStudents();
    setSuccessMessage(`Đã cập nhật hồ sơ học sinh "${editFormData.full_name}" thành công!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Handle Create Save (Tab 2)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!createFormData.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên học sinh';
    if (!createFormData.student_code.trim()) errors.student_code = 'Vui lòng nhập mã học sinh';
    if (!createFormData.class_id) errors.class_id = 'Vui lòng chọn lớp học';
    if (!createFormData.parent_name.trim()) errors.parent_name = 'Vui lòng nhập họ tên phụ huynh/người giám hộ';
    if (!createFormData.parent_phone.trim()) errors.parent_phone = 'Vui lòng nhập số điện thoại phụ huynh';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const targetCls = classes.find((c) => c.id === createFormData.class_id);
      const studentEmail =
        createFormData.email.trim() ||
        `${createFormData.student_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.smartclass.edu.vn`;

      const newStudent = await DataService.createStudent(
        {
          student_code: createFormData.student_code.trim(),
          full_name: createFormData.full_name.trim(),
          email: studentEmail,
          phone: createFormData.phone.trim(),
          gender: createFormData.gender,
          date_of_birth: createFormData.date_of_birth,
          address: createFormData.address.trim(),
          class_id: createFormData.class_id,
          class_name: targetCls?.name || '10A1',
          parent_name: createFormData.parent_name.trim(),
          parent_phone: createFormData.parent_phone.trim(),
          status: createFormData.status
        },
        createAuthPassword || '123456'
      );

      // Reset form
      setCreateFormData({
        student_code: generateStudentCode(),
        full_name: '',
        class_id: selectedClassId || 'cls-10a1',
        gender: 'male',
        date_of_birth: '2010-01-01',
        email: '',
        phone: '',
        address: '',
        parent_name: '',
        parent_phone: '',
        parent_relationship: 'Bố',
        parent_email: '',
        status: 'active',
        notes: ''
      });

      await loadStudents();
      // Switch back to Tab 1 to see result
      handleTabChange('student-list');
      setSuccessMessage(
        `Thêm mới học sinh "${newStudent.full_name}" thành công! Đã tự động lưu vào Firebase (Firestore & Authentication: ${newStudent.email}).`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn('Student creation notice:', err);
      setFormErrors({ submit: err?.message || 'Có lỗi xảy ra khi thêm học sinh. Vui lòng thử lại!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCreateForm = () => {
    setCreateFormData({
      student_code: generateStudentCode(),
      full_name: '',
      class_id: selectedClassId || 'cls-10a1',
      gender: 'male',
      date_of_birth: '2010-01-01',
      email: '',
      phone: '',
      address: '',
      parent_name: '',
      parent_phone: '',
      parent_relationship: 'Bố',
      parent_email: '',
      status: 'active',
      notes: ''
    });
    setFormErrors({});
  };

  const handleTransfer = async () => {
    if (!transferStudent) return;
    const targetCls = classes.find((c) => c.id === targetClassId);
    await DataService.updateStudent(transferStudent.id, {
      class_id: targetClassId,
      class_name: targetCls?.name || '10A2'
    });
    setTransferStudent(null);
    await loadStudents();
    setSuccessMessage(`Đã chuyển học sinh ${transferStudent.full_name} sang lớp ${targetCls?.name || ''}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await DataService.deleteStudent(deleteId);
    setDeleteId(null);
    await loadStudents();
    setSuccessMessage('Đã xóa hồ sơ học sinh thành công.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hồ sơ học sinh</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Quản lý hồ sơ học sinh, thông tin phụ huynh và theo dõi kết quả rèn luyện toàn diện
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons depending on active tab */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {activeTab === 'student-list' ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/teacher/students/import')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('create-student')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleTabChange('student-list')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Xem danh sách học sinh ({students.length})</span>
            </button>
          )}
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

      {/* THREE PRIMARY TABS (Matching Image 1) */}
      <div className="border-b border-slate-200 bg-white px-2 pt-2 rounded-2xl shadow-2xs">
        <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
          {/* TAB 1: DANH SÁCH HỌC SINH */}
          <button
            type="button"
            onClick={() => handleTabChange('student-list')}
            className={`flex items-center gap-2.5 py-3 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
              activeTab === 'student-list'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'student-list' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Danh sách học sinh</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                activeTab === 'student-list' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {students.length}
            </span>
          </button>

          {/* TAB 2: THÔNG TIN PHỤ HUYNH */}
          <button
            type="button"
            onClick={() => handleTabChange('parent-info')}
            className={`flex items-center gap-2.5 py-3 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
              activeTab === 'parent-info'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className={`w-4 h-4 ${activeTab === 'parent-info' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Thông tin phụ huynh</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                activeTab === 'parent-info'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {students.length} PH
            </span>
          </button>

          {/* TAB 3: THÊM MỚI HỌC SINH */}
          <button
            type="button"
            onClick={() => handleTabChange('create-student')}
            className={`flex items-center gap-2.5 py-3 px-4 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
              activeTab === 'create-student'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserPlus className={`w-4 h-4 ${activeTab === 'create-student' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Thêm mới học sinh</span>
          </button>
        </nav>
      </div>

      {/* ============================================================== */}
      {/* TAB 1 CONTENT: DANH SÁCH HỌC SINH (THEO HÌNH 1)                */}
      {/* ============================================================== */}
      {activeTab === 'student-list' && (
        <div className="space-y-4">
          {/* Toolbar filters matching Image 1 */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Dropdown Lớp học matching Image 1 red box */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 shrink-0">Lớp học:</span>
                <select
                  value={filterClass}
                  onChange={(e) => {
                    setFilterClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border-2 border-red-500 text-slate-900 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer shadow-xs"
                >
                  <option value="all">Tất cả các lớp ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.student_count || 0} HS)
                    </option>
                  ))}
                </select>
              </div>

              <SearchBox
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setCurrentPage(1);
                }}
                placeholder="Tìm tên học sinh, mã HS, tên phụ huynh, SĐT..."
                className="flex-1 min-w-[240px]"
              />

              <select
                value={filterGender}
                onChange={(e) => {
                  setFilterGender(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="text-xs font-medium text-slate-500 self-end sm:self-auto">
              Hiển thị <strong className="text-slate-800">{filtered.length}</strong> học sinh ·{' '}
              <span className="font-semibold text-blue-600">
                {classes.find((c) => c.id === filterClass)?.name.replace('Lớp ', '') || '10/1'}
              </span>
            </div>
          </div>

          {/* Table view matching Image 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">STT</th>
                    <th className="px-4 py-3.5">HỌC SINH</th>
                    <th className="px-4 py-3.5">MÃ HỌC SINH</th>
                    <th className="px-4 py-3.5">GIỚI TÍNH</th>
                    <th className="px-4 py-3.5">PHỤ HUYNH LIÊN HỆ</th>
                    <th className="px-4 py-3.5">ĐIỂM TB</th>
                    <th className="px-4 py-3.5">CHUYÊN CẦN</th>
                    <th className="px-4 py-3.5 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">Không tìm thấy học sinh nào phù hợp</p>
                        <p className="text-xs text-slate-400 mt-1">Thử đổi bộ lọc hoặc thêm mới học sinh vào lớp</p>
                        <button
                          type="button"
                          onClick={() => handleTabChange('create-student')}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Thêm mới học sinh</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-blue-100 transition-colors duration-150 group">
                        <td className="px-4 py-3.5 font-semibold text-slate-500">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                s.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                  s.student_code || s.full_name
                                )}`
                              }
                              alt={s.full_name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 bg-slate-100"
                            />
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenStudentDetail(s)}
                                className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer block"
                              >
                                {s.full_name}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                          {s.student_code}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {s.gender === 'female' ? 'Nữ' : 'Nam'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{s.parent_name || '—'}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                                s.parent_relationship === 'Mẹ'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {s.parent_relationship || 'Bố'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.parent_phone}</p>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {s.gpa}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-semibold ${
                              (s.attendance_rate || 100) >= 90 ? 'text-slate-800' : 'text-rose-600'
                            }`}
                          >
                            {s.attendance_rate}%
                          </span>
                        </td>
                        {/* Actions matching Image 1 red box: Eye, Edit, Trash */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 border-2 border-red-500/90 p-1 rounded-xl bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleOpenStudentDetail(s)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Xem hồ sơ học sinh"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(s);
                                setEditFormData({
                                  student_code: s.student_code,
                                  full_name: s.full_name,
                                  email: s.email,
                                  phone: s.phone || '',
                                  gender: (s.gender as any) || 'male',
                                  date_of_birth: s.date_of_birth || '2010-01-01',
                                  address: s.address || '',
                                  class_id: s.class_id,
                                  parent_name: s.parent_name || '',
                                  parent_phone: s.parent_phone || ''
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Sửa thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(s.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2 CONTENT: THÔNG TIN PHỤ HUYNH (THEO HÌNH 2 & HÌNH 3)      */}
      {/* ============================================================== */}
      {activeTab === 'parent-info' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Top 4 KPI Cards (Chuẩn 100% theo hình 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng số Phụ huynh */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Tổng số Phụ huynh</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">{totalParents}</span>
                  <span className="text-xs font-semibold text-slate-500">người</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                  {fathersCount} Bố · {mothersCount} Mẹ
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Đã kết nối App */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Đã kết nối App</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {connectedCount}/{totalParents}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">({connectedPercent}%)</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                  Đang nhận thông báo học tập
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Đầy đủ số điện thoại */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Đầy đủ số điện thoại</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-extrabold text-blue-600">
                    {totalParents}/{totalParents}
                  </span>
                  <span className="text-xs font-semibold text-blue-600">(100%)</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                  Đảm bảo liên lạc khẩn cấp
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Ban Đại diện CMHS */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Ban Đại diện CMHS</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  Trần Văn Kiên <span className="text-xs font-semibold text-purple-700">(Trưởng ban)</span>
                </p>
                <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                  Vũ Thị Loan (Phó ban đại diện)
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Toolbar filters for Parents */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">Lớp học:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="bg-white border border-slate-200 font-bold text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả các lớp ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.student_count || 0} HS)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-600 shrink-0">App SmartClass:</span>
                <select
                  value={filterParentApp}
                  onChange={(e) => setFilterParentApp(e.target.value as any)}
                  className="bg-white border border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="connected">Đã kết nối</option>
                  <option value="not_connected">Chưa kết nối</option>
                </select>
              </div>

              <SearchBox
                value={searchParent}
                onChange={setSearchParent}
                placeholder="Tìm phụ huynh, con (học sinh), số điện thoại..."
                className="flex-1 min-w-[240px]"
              />
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-xs font-medium text-slate-500">
                Hiển thị <strong className="text-slate-800">{filteredParents.length}</strong> phụ huynh ·{' '}
                <span className="font-semibold text-blue-600">
                  {classes.find((c) => c.id === filterClass)?.name.replace('Lớp ', '') || '10/1'}
                </span>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setParentViewMode('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    parentViewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng bảng"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParentViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    parentViewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng thẻ"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng thẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* DẠNG BẢNG (Chuẩn có thanh trượt ngang và 3 nút View, Edit, Liên hệ fix cố định bên phải, chỉ giữ icon) */}
          {parentViewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Gợi ý cuộn ngang */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                  <span>Kéo thanh trượt ngang để xem đầy đủ thông tin phụ huynh</span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Cột <strong>Thao tác (View, Edit, Liên hệ)</strong> luôn cố định bên phải màn hình
                </div>
              </div>

              {/* Khung cuộn ngang có thanh trượt */}
              <div className="overflow-x-auto custom-horizontal-scrollbar pb-1">
                <table className="w-full min-w-[1100px] text-left text-xs sm:text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 w-14 min-w-[56px] text-center whitespace-nowrap">STT</th>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 min-w-[220px] whitespace-nowrap">PHỤ HUYNH ĐẠI DIỆN</th>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 min-w-[180px] whitespace-nowrap">CON (HỌC SINH)</th>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 min-w-[230px] whitespace-nowrap">SỐ ĐIỆN THOẠI LIÊN HỆ</th>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 min-w-[200px] whitespace-nowrap">EMAIL PHỤ HUYNH</th>
                      <th className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 min-w-[130px] whitespace-nowrap">SMARTCLASS APP</th>
                      {/* Cột THAO TÁC cố định bên phải (sticky right) */}
                      <th className="px-3.5 py-3.5 text-center uppercase font-semibold text-[11px] text-slate-600 sticky right-0 bg-slate-100 z-20 border-b border-l border-slate-200 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.1)] w-36 min-w-[144px] whitespace-nowrap">
                        THAO TÁC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParents.map((s, idx) => {
                      const parentName = s.parent_name || 'Nguyễn Văn Hùng';
                      const parentRel = s.parent_relationship || 'Bố';
                      const phone = s.parent_phone || '0913 556 778';
                      const cleanPhone = phone.replace(/\D/g, '');
                      const email = s.parent_email || `${s.student_code.toLowerCase()}@phuhuynh.edu.vn`;
                      const isConnected = s.app_connected !== false;
                      const initialLetter = parentName.split(' ').pop()?.charAt(0) || parentName.charAt(0) || 'P';

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-blue-100 transition-colors duration-150 group cursor-pointer"
                          onClick={() => handleOpenParentDetail(s)}
                          title="Nhấp để xem chi tiết hồ sơ phụ huynh 360°"
                        >
                          {/* STT trên 1 dòng */}
                          <td className="px-4 py-3 font-semibold text-slate-500 border-b border-slate-100 text-center whitespace-nowrap">
                            {idx + 1}
                          </td>

                          {/* Phụ huynh đại diện: avatar, tên, quan hệ (đã bỏ badge ban ĐD CMHS theo viền đỏ) */}
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                                {initialLetter}
                              </div>
                              <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {parentName}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                                  parentRel === 'Mẹ'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {parentRel}
                              </span>
                            </div>
                          </td>

                          {/* Con (Học sinh): avatar, tên học sinh (đã bỏ mã số học sinh và lớp theo viền đỏ) */}
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); handleOpenStudentDetail(s); }}>
                            <div className="flex items-center gap-2 group/student hover:opacity-90 transition-opacity">
                              <img
                                src={
                                  s.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                    s.student_code || s.full_name
                                  )}`
                                }
                                alt={s.full_name}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                              />
                              <span className="font-bold text-slate-900 group-hover/student:text-blue-700 transition-colors">
                                {s.full_name}
                              </span>
                            </div>
                          </td>

                          {/* Số điện thoại liên hệ: SĐT, Copy, Call, Zalo trên CÙNG 1 DÒNG */}
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(s.id, phone)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-colors cursor-pointer shadow-2xs"
                                title="Sao chép SĐT"
                              >
                                {copiedPhoneStudentId === s.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={`tel:${cleanPhone}`}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-colors shadow-2xs"
                                title="Gọi điện"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://zalo.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Chat qua Zalo"
                              >
                                Zalo
                              </a>
                            </div>
                          </td>

                          {/* Email Phụ huynh trên CÙNG 1 DÒNG */}
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`mailto:${email}`}
                              className="text-xs text-slate-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                              title={`Gửi email đến ${email}`}
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{email}</span>
                            </a>
                          </td>

                          {/* SmartClass App trên CÙNG 1 DÒNG */}
                          <td className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">
                            {isConnected ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Đã kết nối
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Chưa kết nối
                              </span>
                            )}
                          </td>

                          {/* 3 NÚT VIEW, EDIT, LIÊN HỆ ĐƯỢC FIX CỐ ĐỊNH BÊN PHẢI (STICKY RIGHT) - HÒA CÙNG MÀU HOVER KHI RÊ CHUỘT */}
                          <td
                            className="px-3.5 py-2.5 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-blue-100 transition-colors duration-150 z-10 border-b border-l border-slate-200 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.08)] w-36 min-w-[144px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {/* 1. Nút View (chỉ icon Eye - Không ghi chữ) */}
                              <button
                                type="button"
                                onClick={() => handleOpenParentDetail(s)}
                                className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-200 text-blue-700 border border-blue-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                title="Xem hồ sơ phụ huynh 360°"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>

                              {/* 2. Nút Edit (chỉ icon Edit - Không ghi chữ) */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditParent(s)}
                                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                title="Chỉnh sửa thông tin phụ huynh"
                              >
                                <Edit className="w-4 h-4 text-slate-500" />
                              </button>

                              {/* 3. Nút Liên hệ (chỉ icon MessageSquare - Không ghi chữ) */}
                              <button
                                type="button"
                                onClick={() => setContactParentStudent(s)}
                                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title="Liên hệ phụ huynh (Gọi điện, Nhắn Zalo, Gửi tin nhắn SMS)"
                              >
                                <MessageSquare className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* DẠNG THẺ LƯỚI PHỤ HUYNH (Hiển thị nhiều phụ huynh trực quan sinh động) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParents.map((s, idx) => {
                const parentName = s.parent_name || 'Nguyễn Văn Hùng';
                const parentRel = s.parent_relationship || 'Bố';
                const phone = s.parent_phone || '0913 556 778';
                const cleanPhone = phone.replace(/\D/g, '');
                const isConnected = s.app_connected !== false;
                const initialLetter = parentName.split(' ').pop()?.charAt(0) || parentName.charAt(0) || 'P';

                return (
                  <div
                    key={s.id}
                    onClick={() => handleOpenParentDetail(s)}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Parent Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            {initialLetter}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {parentName}
                              </h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                  parentRel === 'Mẹ'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {parentRel}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">Đại diện gia đình #{idx + 1}</span>
                          </div>
                        </div>

                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã kết nối App
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                            Chưa kết nối App
                          </span>
                        )}
                      </div>

                      {/* CMHS Role Badge if present */}
                      {s.parent_cmhs_role && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 font-semibold w-fit">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>{s.parent_cmhs_role}</span>
                        </div>
                      )}

                      {/* Student Info Box */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <img
                          src={
                            s.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                              s.student_code || s.full_name
                            )}`
                          }
                          alt={s.full_name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Con theo học:</span>
                          <span className="font-bold text-xs text-slate-900 truncate block">{s.full_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {s.student_code} · {s.class_name || '10/1'}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700" onClick={(e) => e.stopPropagation()}>
                          <span className="text-slate-400 text-[11px]">Số điện thoại:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(s.id, phone)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Sao chép SĐT"
                            >
                              {copiedPhoneStudentId === s.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Gọi điện ngay"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        {s.parent_email && (
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-400 text-[11px]">Email:</span>
                            <span className="font-medium text-slate-800 text-[11px] truncate max-w-[170px]" title={s.parent_email}>
                              {s.parent_email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions (Chỉ giữ lại icon, không ghi chữ) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenParentDetail(s)}
                        className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Xem đầy đủ hồ sơ phụ huynh 360°"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditParent(s)}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="Chỉnh sửa thông tin phụ huynh"
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setContactParentStudent(s)}
                        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                        title="Liên hệ phụ huynh (Gọi điện, Nhắn Zalo, SMS)"
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2 CONTENT: THÊM MỚI HỌC SINH                                */}
      {/* ============================================================== */}
      {activeTab === 'create-student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (8 Cols) */}
          <div className="lg:col-span-8">
            <form
              onSubmit={handleCreateSubmit}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              {/* Form Title Banner */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-b border-slate-200/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      Thêm mới học sinh vào hệ thống
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Khởi tạo hồ sơ 360°, thông tin liên hệ gia đình và phân bổ vào lớp học
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    Hồ sơ 360°
                  </span>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {formErrors.submit && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.submit}</span>
                  </div>
                )}

                {/* Phần 1: Thông tin học sinh */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    Thông tin cơ bản của học sinh
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mã học sinh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mã học sinh <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={createFormData.student_code}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, student_code: e.target.value })
                          }
                          placeholder="VD: HS2025-1001"
                          className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden ${
                            formErrors.student_code ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCreateFormData({ ...createFormData, student_code: generateStudentCode() })
                          }
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Tạo mã ngẫu nhiên mới"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {formErrors.student_code && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.student_code}</p>
                      )}
                    </div>

                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Họ và tên học sinh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.full_name}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, full_name: e.target.value })
                        }
                        placeholder="VD: Nguyễn Văn Anh"
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden ${
                          formErrors.full_name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                      {formErrors.full_name && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.full_name}</p>
                      )}
                    </div>

                    {/* Phân bổ vào lớp */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Phân bổ vào Lớp học <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createFormData.class_id}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, class_id: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.room ? `(${c.room})` : ''} - Sĩ số: {c.student_count || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Giới tính */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Giới tính
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            createFormData.gender === 'male'
                              ? 'bg-blue-50/80 border-blue-500 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            checked={createFormData.gender === 'male'}
                            onChange={() => setCreateFormData({ ...createFormData, gender: 'male' })}
                            className="sr-only"
                          />
                          Nam
                        </label>
                        <label
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            createFormData.gender === 'female'
                              ? 'bg-pink-50/80 border-pink-500 text-pink-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            checked={createFormData.gender === 'female'}
                            onChange={() => setCreateFormData({ ...createFormData, gender: 'female' })}
                            className="sr-only"
                          />
                          Nữ
                        </label>
                      </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={createFormData.date_of_birth}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, date_of_birth: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Số điện thoại học sinh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Số điện thoại cá nhân (nếu có)
                      </label>
                      <input
                        type="tel"
                        value={createFormData.phone}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, phone: e.target.value })
                        }
                        placeholder="0912 345 678"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Email học sinh */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email học sinh (để trống sẽ tự tạo theo mã số)
                      </label>
                      <input
                        type="email"
                        value={createFormData.email}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, email: e.target.value })
                        }
                        placeholder="vd: hs20251001@student.edu.vn"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Địa chỉ */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Địa chỉ thường trú / Nơi ở hiện tại
                      </label>
                      <input
                        type="text"
                        value={createFormData.address}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, address: e.target.value })
                        }
                        placeholder="Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Phần 2: Thông tin phụ huynh & Người giám hộ */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    Thông tin Phụ huynh & Người giám hộ liên hệ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ tên phụ huynh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Họ và tên Phụ huynh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.parent_name}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, parent_name: e.target.value })
                        }
                        placeholder="VD: Nguyễn Văn Tuấn"
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden ${
                          formErrors.parent_name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                      {formErrors.parent_name && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.parent_name}</p>
                      )}
                    </div>

                    {/* SĐT Phụ huynh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Số điện thoại liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={createFormData.parent_phone}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, parent_phone: e.target.value })
                        }
                        placeholder="0987 654 321 (Nhận tin nhắn Zalo/SMS)"
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden ${
                          formErrors.parent_phone ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                      {formErrors.parent_phone && (
                        <p className="text-xs text-rose-500 mt-1">{formErrors.parent_phone}</p>
                      )}
                    </div>

                    {/* Mối quan hệ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Quan hệ với học sinh
                      </label>
                      <select
                        value={createFormData.parent_relationship}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            parent_relationship: e.target.value
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                      >
                        <option value="Bố">Bố (Cha)</option>
                        <option value="Mẹ">Mẹ</option>
                        <option value="Người giám hộ">Người giám hộ hợp pháp</option>
                        <option value="Ông/Bà">Ông / Bà</option>
                      </select>
                    </div>

                    {/* Email phụ huynh */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email phụ huynh (nhận sổ liên lạc)
                      </label>
                      <input
                        type="email"
                        value={createFormData.parent_email}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, parent_email: e.target.value })
                        }
                        placeholder="phuhuynh@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Phần 3: Thiết lập & Ghi chú */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                      3
                    </span>
                    Trạng thái & Ghi chú giáo viên
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Trạng thái học tập
                      </label>
                      <select
                        value={createFormData.status}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, status: e.target.value as any })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
                      >
                        <option value="active">Đang theo học (Chính thức)</option>
                        <option value="suspended">Tạm nghỉ / Bảo lưu</option>
                        <option value="transferred">Chuyển trường</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Điểm rèn luyện khởi tạo
                      </label>
                      <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-semibold flex items-center justify-between">
                        <span>100 điểm (Mặc định xuất sắc)</span>
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ghi chú ban đầu (Sức khỏe, năng khiếu, lưu ý đặc biệt)
                      </label>
                      <textarea
                        rows={3}
                        value={createFormData.notes}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, notes: e.target.value })
                        }
                        placeholder="VD: Cận thị nhẹ ngồi bàn đầu, có năng khiếu bóng rổ..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden resize-none"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Phần 4: Tự động kết nối Firebase Authentication */}
                <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-50/70 via-blue-50/50 to-indigo-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>Tự động đồng bộ Firebase Authentication</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Tự động 100%
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tài khoản đăng nhập của học sinh sẽ được kích hoạt trực tiếp trong Firebase Authentication ngay khi tạo hồ sơ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mật khẩu đăng nhập khởi tạo (ít nhất 6 ký tự)
                      </label>
                      <input
                        type="text"
                        value={createAuthPassword}
                        onChange={(e) => setCreateAuthPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Email tài khoản Firebase Auth
                      </label>
                      <div className="text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 truncate font-mono">
                        {createFormData.email.trim() ||
                          `${createFormData.student_code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mahs'}@student.smartclass.edu.vn`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCreateForm}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Làm mới form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('student-list')}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang khởi tạo...' : 'Lưu & Khởi tạo hồ sơ 360°'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Helper Cards (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Excel Import Card */}
            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-base">Nhập danh sách nhanh từ Excel</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Có file danh sách học sinh từ nhà trường? Nhập hàng loạt 40 - 50 học sinh chỉ trong vài giây với mẫu chuẩn.
              </p>
              <button
                type="button"
                onClick={() => navigate('/teacher/students/import')}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Mở trình Nhập Excel</span>
              </button>
            </div>

            {/* Standard Specifications Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Chuẩn hóa hồ sơ 360°
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Mã học sinh:</strong> Là định danh duy nhất dùng để đăng nhập hệ thống và kết nối ứng dụng học sinh.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Số điện thoại phụ huynh:</strong> Cần nhập chính xác để gửi báo cáo chuyên cần, điểm số tự động qua Zalo/SMS.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Đồng bộ tức thời:</strong> Sau khi lưu, học sinh xuất hiện ngay trong danh sách điểm danh và sổ điểm của lớp.
                  </span>
                </li>
              </ul>
            </div>

            {/* Current Class Capacities */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Sĩ số các lớp hiện tại
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-700">{cls.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold font-mono">
                      {cls.student_count || 0} HS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS & DRAWERS                                              */}
      {/* ============================================================== */}

      {/* 360 Degree Student & Parent Profile Modal (Khớp hình đính kèm thứ 3) */}
      <StudentProfileModal
        isOpen={Boolean(profileStudent)}
        onClose={() => setProfileStudent(null)}
        student={profileStudent}
        initialTab={profileInitialTab}
      />

      {/* Quick Parent Contact Modal (Gọi điện, Nhắn Zalo, Gửi tin nhắn mẫu vào Sổ liên lạc) */}
      <ParentContactModal
        isOpen={Boolean(contactParentStudent)}
        onClose={() => setContactParentStudent(null)}
        student={contactParentStudent}
        onSuccessToast={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(null), 3500);
        }}
      />

      {/* Modal Chỉnh sửa thông tin Phụ huynh */}
      <Modal
        isOpen={Boolean(editingParentStudent)}
        onClose={() => setEditingParentStudent(null)}
        title="Chỉnh sửa thông tin Phụ huynh"
        subtitle={`Cập nhật thông tin phụ huynh của em ${editingParentStudent?.full_name} (${editingParentStudent?.class_name || '10/1'})`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveParentEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên phụ huynh *
              </label>
              <input
                type="text"
                required
                value={editParentFormData.parent_name}
                onChange={(e) =>
                  setEditParentFormData({ ...editParentFormData, parent_name: e.target.value })
                }
                placeholder="VD: Nguyễn Văn Hùng"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mối quan hệ
              </label>
              <select
                value={editParentFormData.parent_relationship}
                onChange={(e) =>
                  setEditParentFormData({ ...editParentFormData, parent_relationship: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden cursor-pointer"
              >
                <option value="Bố">Bố (Cha)</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Người giám hộ">Người giám hộ</option>
                <option value="Ông/Bà">Ông / Bà</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại liên hệ *
              </label>
              <input
                type="tel"
                required
                value={editParentFormData.parent_phone}
                onChange={(e) =>
                  setEditParentFormData({ ...editParentFormData, parent_phone: e.target.value })
                }
                placeholder="0913 556 778"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email phụ huynh
              </label>
              <input
                type="email"
                value={editParentFormData.parent_email}
                onChange={(e) =>
                  setEditParentFormData({ ...editParentFormData, parent_email: e.target.value })
                }
                placeholder="phuhuynh@smartclass.edu.vn"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vai trò trong Ban Đại diện CMHS (nếu có)
            </label>
            <input
              type="text"
              value={editParentFormData.parent_cmhs_role}
              onChange={(e) =>
                setEditParentFormData({ ...editParentFormData, parent_cmhs_role: e.target.value })
              }
              placeholder="VD: Trưởng ban ĐD CMHS, Phó ban ĐD CMHS..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Kết nối SmartClass App</span>
              <span className="text-[11px] text-slate-500">Phụ huynh đã kích hoạt tài khoản sổ liên lạc điện tử</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editParentFormData.app_connected}
                onChange={(e) =>
                  setEditParentFormData({ ...editParentFormData, app_connected: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingParentStudent(null)}
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

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin học sinh"
        subtitle="Cập nhật thông tin cơ bản và liên hệ phụ huynh"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã số học sinh *
              </label>
              <input
                type="text"
                required
                value={editFormData.student_code}
                onChange={(e) => setEditFormData({ ...editFormData, student_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên học sinh *
              </label>
              <input
                type="text"
                required
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp học</label>
              <select
                value={editFormData.class_id}
                onChange={(e) => setEditFormData({ ...editFormData, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email học sinh</label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="an.nv@student.edu.vn"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Thông tin phụ huynh</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Họ tên phụ huynh
                </label>
                <input
                  type="text"
                  value={editFormData.parent_name}
                  onChange={(e) => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                  placeholder="VD: Ông Nguyễn Văn Đức"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SĐT phụ huynh
                </label>
                <input
                  type="tel"
                  value={editFormData.parent_phone}
                  onChange={(e) => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                  placeholder="0987 654 321"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              Cập nhật hồ sơ
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Class Modal */}
      <Modal
        isOpen={Boolean(transferStudent)}
        onClose={() => setTransferStudent(null)}
        title="Chuyển lớp học sinh"
        subtitle={`Chuyển em ${transferStudent?.full_name} sang lớp khác`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Học sinh hiện tại thuộc lớp: <strong className="text-slate-900">{transferStudent?.class_name}</strong>.
            Chọn lớp học đích:
          </p>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden font-medium cursor-pointer"
          >
            {classes
              .filter((c) => c.id !== transferStudent?.class_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setTransferStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleTransfer}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer"
            >
              Xác nhận chuyển lớp
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa hồ sơ học sinh"
        message="Bạn có chắc chắn muốn xóa học sinh này khỏi hệ thống? Dữ liệu điểm danh và bài làm liên quan cũng sẽ được lưu trữ."
        confirmLabel="Xóa vĩnh viễn"
        isDestructive={true}
      />
    </div>
  );
};
