import React, { useState } from 'react';
import { Student } from '../../types';
import { StatusChip } from '../common/StatusChip';
import {
  User,
  GraduationCap,
  Users,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Briefcase,
  Home,
  AlertCircle,
  FileText,
  Printer,
  Heart,
  Smartphone,
  BookOpen
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialTab?: 'student-info' | 'academic' | 'parent-info';
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  initialTab = 'student-info'
}) => {
  const [activeTab, setActiveTab] = useState<'student-info' | 'academic' | 'parent-info'>(initialTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !student) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Derive father & mother data with realistic defaults
  const isFather = student.parent_relationship ? student.parent_relationship.toLowerCase().includes('bố') || student.parent_relationship.toLowerCase().includes('cha') : true;
  
  const fatherName = isFather 
    ? (student.parent_name || 'Ông Lê Văn Minh') 
    : 'Ông Nguyễn Văn Thành';
  const fatherPhone = isFather 
    ? (student.parent_phone || '0903 888 999') 
    : '0912 888 777';
  const fatherJob = student.parent_job || 'Kỹ sư công nghệ';
  const fatherWorkplace = student.parent_workplace || 'Công ty CP Công nghệ & Viễn thông Hà Nội';
  const fatherEmail = student.parent_email || (isFather ? 'phuhuynh.' + (student.student_code?.toLowerCase() || 'hs') + '@gmail.com' : 'minh.le.parent@gmail.com');

  const motherName = student.mother_name || (!isFather ? student.parent_name || 'Bà Nguyễn Thị Mai Lan' : 'Bà Nguyễn Thị Mai Lan');
  const motherPhone = student.mother_phone || (!isFather ? student.parent_phone || '0912 345 678' : '0912 345 678');
  const motherJob = student.mother_job || 'Giáo viên THCS';
  const motherWorkplace = student.mother_workplace || 'Trường THCS Giảng Võ, Ba Đình';
  const motherEmail = student.mother_email || 'lan.nguyen.edu@gmail.com';

  const studentAvatar = student.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      student.student_code || student.full_name
    )}`;

  // Sample grades calculation
  const baseGPA = student.gpa || 8.5;
  const sampleSubjects = [
    { name: 'Toán học', tx: '9.0, 9.5', gk: '8.8', ck: (baseGPA + 0.2).toFixed(1), tbm: (baseGPA + 0.3).toFixed(1), grade: 'Giỏi' },
    { name: 'Ngữ văn', tx: '8.0, 8.5', gk: '8.0', ck: (baseGPA - 0.4).toFixed(1), tbm: (baseGPA - 0.3).toFixed(1), grade: 'Khá' },
    { name: 'Tiếng Anh', tx: '9.0, 9.0', gk: '9.2', ck: (baseGPA + 0.4).toFixed(1), tbm: (baseGPA + 0.5).toFixed(1), grade: 'Giỏi' },
    { name: 'Vật lý', tx: '8.5, 9.0', gk: '8.5', ck: baseGPA.toFixed(1), tbm: (baseGPA + 0.1).toFixed(1), grade: 'Giỏi' },
    { name: 'Hóa học', tx: '8.5, 8.5', gk: '8.0', ck: (baseGPA - 0.1).toFixed(1), tbm: baseGPA.toFixed(1), grade: 'Giỏi' },
    { name: 'Sinh học', tx: '8.5, 9.0', gk: '8.5', ck: (baseGPA + 0.1).toFixed(1), tbm: (baseGPA + 0.2).toFixed(1), grade: 'Giỏi' },
    { name: 'Lịch sử & Địa lý', tx: '8.5, 8.5', gk: '8.5', ck: (baseGPA - 0.2).toFixed(1), tbm: (baseGPA - 0.1).toFixed(1), grade: 'Khá' },
    { name: 'Tin học', tx: '9.5, 10', gk: '9.5', ck: '9.8', tbm: '9.7', grade: 'Giỏi' },
    { name: 'GDCD', tx: '9.0, 9.0', gk: '9.0', ck: '9.2', tbm: '9.1', grade: 'Giỏi' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Đóng hồ sơ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pr-10">
            <div className="relative">
              <img
                src={studentAvatar}
                alt={student.full_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/30 bg-white/10 shadow-md"
              />
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase shadow-xs">
                {student.status === 'active' ? 'Đang học' : 'Hoạt động'}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{student.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {student.gender === 'female' ? 'Nữ' : 'Nam'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-slate-900 font-bold">
                  Học lực: {Number(student.gpa || 8.5) >= 8.0 ? 'Giỏi' : 'Khá'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100">
                <span className="flex items-center gap-1 font-mono">
                  Mã học sinh: <strong className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">{student.student_code}</strong>
                </span>
                <span>•</span>
                <span>
                  Lớp: <strong className="text-white font-semibold">{student.class_name || '10A1'}</strong>
                </span>
                <span>•</span>
                <span>
                  Niên khóa: <strong className="text-white">2025 - 2026</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3 Main Tabs Nav inside Header */}
          <div className="mt-5 flex gap-2 border-t border-white/20 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('student-info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'student-info'
                  ? 'bg-white text-blue-700 shadow-md shadow-black/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. Thông tin học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'academic'
                  ? 'bg-white text-blue-700 shadow-md shadow-black/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>2. Kết quả học tập</span>
              <span className="text-[10px] bg-amber-400/30 px-1.5 py-0.5 rounded-full font-bold">
                GPA {student.gpa || '8.8'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parent-info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'parent-info'
                  ? 'bg-white text-blue-700 shadow-md shadow-black/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>3. Thông tin phụ huynh</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'parent-info' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-400/30 text-white'
              }`}>
                Đã liên kết
              </span>
            </button>
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: THÔNG TIN HỌC SINH                                       */}
          {/* ============================================================== */}
          {activeTab === 'student-info' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Personal Details Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Lý lịch trích ngang & Thông tin cá nhân</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Hồ sơ điện tử chuẩn Bộ GD&ĐT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Họ và tên khai sinh:</span>
                    <span className="font-bold text-slate-800 text-sm">{student.full_name}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Mã định danh học sinh:</span>
                    <span className="font-bold font-mono text-blue-600 text-sm">{student.student_code}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Giới tính:</span>
                    <span className="font-semibold text-slate-800">
                      {student.gender === 'female' ? 'Nữ' : 'Nam'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Ngày sinh:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {student.date_of_birth || '14/05/2010'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Nơi sinh / Quê quán:</span>
                    <span className="font-semibold text-slate-800">Hà Nội, Việt Nam</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Dân tộc / Tôn giáo:</span>
                    <span className="font-semibold text-slate-800">
                      {student.ethnicity || 'Kinh'} • {student.religion || 'Không'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Số CCCD / Định danh cá nhân:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {student.national_id || '001210009876'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Điện thoại học sinh:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold font-mono text-slate-800">{student.phone || '0933 111 222'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(student.phone || '0933 111 222', 'stuPhone')}
                        className="text-blue-600 hover:text-blue-700"
                        title="Sao chép"
                      >
                        {copiedField === 'stuPhone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block mb-1">Email học sinh:</span>
                    <span className="font-semibold text-slate-800 truncate block" title={student.email}>
                      {student.email || 'student@smartclass.edu.vn'}
                    </span>
                  </div>
                </div>

                {/* Address block */}
                <div className="p-3.5 bg-slate-50 rounded-xl flex items-start gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block mb-0.5">Địa chỉ thường trú & nơi ở hiện nay:</span>
                    <span className="font-semibold text-slate-800">
                      {student.address || 'Số 15 ngõ 84 Ngọc Khánh, Phường Giảng Võ, Quận Ba Đình, TP. Hà Nội'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Class & Extra Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tổ chức lớp & Hoạt động Đoàn - Đội</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Lớp hiện tại:</span>
                      <span className="font-bold text-blue-600">{student.class_name || '10A1 - Chuyên Toán'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Chức vụ trong lớp:</span>
                      <span className="font-semibold text-slate-800">{student.class_role || 'Tổ trưởng Tổ 1'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Đoàn viên TNCS HCM:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã kết nạp
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Giáo viên chủ nhiệm:</span>
                      <span className="font-semibold text-slate-800">Cô Trần Thị Mai</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sức khỏe & Ghi chú y tế học đường</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Tình trạng thể lực:</span>
                      <span className="font-semibold text-emerald-600">Loại I (Tốt)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Nhóm máu:</span>
                      <span className="font-bold text-slate-800">{student.blood_type || 'O+'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Bảo hiểm y tế học sinh:</span>
                      <span className="font-mono font-semibold text-slate-700">HS4012093847291</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Lưu ý y tế / Dị ứng:</span>
                      <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Dị ứng nhẹ phấn hoa
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: KẾT QUẢ HỌC TẬP & CHUYÊN CẦN                              */}
          {/* ============================================================== */}
          {activeTab === 'academic' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide block relative z-10">
                    Điểm trung bình (GPA)
                  </span>
                  <span className="text-3xl font-extrabold text-blue-900 my-1 block relative z-10">
                    {student.gpa || '8.8'}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 relative z-10">
                    Xếp loại: Học sinh Giỏi
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide block relative z-10">
                    Tỷ lệ chuyên cần
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-900 my-1 block relative z-10">
                    {student.attendance_rate || 98}%
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 relative z-10">
                    Có mặt: 44/45 buổi
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-0" />
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block relative z-10">
                    Điểm rèn luyện
                  </span>
                  <span className="text-3xl font-extrabold text-purple-900 my-1 block relative z-10">
                    {student.behavior_score || 96}đ
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 relative z-10">
                    Hạnh kiểm: Tốt (Xuất sắc)
                  </span>
                </div>
              </div>

              {/* Subject Grades Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Bảng điểm chi tiết Học kỳ I (Năm học 2025 - 2026)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Hệ số chuẩn TT22/BGDĐT</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Môn học</th>
                        <th className="px-3 py-2.5 text-center">Thường xuyên</th>
                        <th className="px-3 py-2.5 text-center">Giữa kỳ</th>
                        <th className="px-3 py-2.5 text-center">Cuối kỳ</th>
                        <th className="px-3 py-2.5 text-center font-bold text-blue-700">TBM</th>
                        <th className="px-3 py-2.5 text-right">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sampleSubjects.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{sub.name}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-600">{sub.tx}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-600">{sub.gk}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-600">{sub.ck}</td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-600">{sub.tbm}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              sub.grade === 'Giỏi' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {sub.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Awards and Badges */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Khen thưởng & Thành tích tiêu biểu</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 flex items-start gap-3">
                    <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Danh hiệu Học sinh Xuất sắc</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Xếp hạng 2 toàn khối 10 trong đợt thi giữa kỳ</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">Huy hiệu Chuyên cần gương mẫu</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">Không vắng, không đi trễ trong suốt 8 tuần liên tiếp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: THÔNG TIN PHỤ HUYNH (YÊU CẦU ĐẶC BIỆT THEO HÌNH ẢNH)      */}
          {/* ============================================================== */}
          {activeTab === 'parent-info' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Top Banner Notice */}
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Hồ sơ gia đình đã được xác thực qua Cổng Sổ liên lạc điện tử nhà trường.
                  </span>
                </div>
                <span className="font-bold text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                  Đã kết nối App
                </span>
              </div>

              {/* Grid 2 Cards: Cha (Bố) & Mẹ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* THÔNG TIN CHA (BỐ) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        Bố
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Thông tin Cha (Bố)</h4>
                        <span className="text-[11px] text-slate-400">Người đại diện liên hệ số 1</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md">
                      Người giám hộ chính
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Họ và tên cha:</span>
                      <span className="text-sm font-bold text-slate-900">{fatherName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm sinh:</span>
                        <span className="font-semibold text-slate-700">1980 (45 tuổi)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Nghề nghiệp:</span>
                        <span className="font-semibold text-slate-700">{fatherJob}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Cơ quan / Nơi làm việc:</span>
                      <span className="font-medium text-slate-800">{fatherWorkplace}</span>
                    </div>

                    {/* Phone with quick call & copy */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] mb-1">Số điện thoại liên hệ:</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">{fatherPhone}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(fatherPhone, 'fatherPhone')}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Sao chép số"
                          >
                            {copiedField === 'fatherPhone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`tel:${fatherPhone.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> Gọi
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-slate-400 block text-[11px] mb-0.5">Email phụ huynh:</span>
                        <span className="font-semibold text-slate-800 truncate block">{fatherEmail}</span>
                      </div>
                      <a
                        href={`mailto:${fatherEmail}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg shrink-0 transition-colors"
                        title="Gửi email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* THÔNG TIN MẸ */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        Mẹ
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Thông tin Mẹ</h4>
                        <span className="text-[11px] text-slate-400">Người đại diện liên hệ số 2</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md">
                      Phụ huynh
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Họ và tên mẹ:</span>
                      <span className="text-sm font-bold text-slate-900">{motherName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Năm sinh:</span>
                        <span className="font-semibold text-slate-700">1983 (42 tuổi)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Nghề nghiệp:</span>
                        <span className="font-semibold text-slate-700">{motherJob}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Cơ quan / Nơi làm việc:</span>
                      <span className="font-medium text-slate-800">{motherWorkplace}</span>
                    </div>

                    {/* Phone with quick call & copy */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px] mb-1">Số điện thoại liên hệ:</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">{motherPhone}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(motherPhone, 'motherPhone')}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Sao chép số"
                          >
                            {copiedField === 'motherPhone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`tel:${motherPhone.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> Gọi
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-slate-400 block text-[11px] mb-0.5">Email phụ huynh:</span>
                        <span className="font-semibold text-slate-800 truncate block">{motherEmail}</span>
                      </div>
                      <a
                        href={`mailto:${motherEmail}`}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg shrink-0 transition-colors"
                        title="Gửi email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact & Family Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Liên hệ khẩn cấp & Địa chỉ nhận tin</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block mb-1">Thứ tự ưu tiên liên hệ khẩn cấp:</span>
                      <p className="font-semibold text-slate-800">
                        1. Cha ({fatherName}) - <strong className="font-mono text-blue-600">{fatherPhone}</strong>
                      </p>
                      <p className="font-semibold text-slate-800 mt-1">
                        2. Mẹ ({motherName}) - <strong className="font-mono text-purple-600">{motherPhone}</strong>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block mb-1">Địa chỉ nhận giấy báo & thư ngỏ:</span>
                      <p className="font-semibold text-slate-800">
                        {student.address || 'Số 15 ngõ 84 Ngọc Khánh, Ba Đình, Hà Nội'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Trạng thái Sổ liên lạc điện tử</span>
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">Tài khoản Mobile App:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã kích hoạt
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">Nhận thông báo điểm danh tức thì:</span>
                      <span className="font-semibold text-blue-600">Qua App & SMS</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-600">Lần xem sổ liên lạc gần nhất:</span>
                      <span className="font-medium text-slate-700">Hôm qua, 20:45</span>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 text-[11px]">
                      <strong>Ghi chú từ gia đình:</strong> "{student.family_note || 'Gia đình cam kết luôn đồng hành cùng nhà trường và GVCN trong việc rèn luyện của học sinh.'}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dữ liệu học sinh được bảo mật theo quy định nhà trường</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In hồ sơ</span>
            </button>

            <a
              href={`tel:${fatherPhone.replace(/\s+/g, '')}`}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Liên hệ phụ huynh</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
