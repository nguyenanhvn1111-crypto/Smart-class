import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataService } from '../../services/dataService';
import { useClass } from '../../contexts/ClassContext';
import { ClassModel, Student, Assignment, AttendanceSession, ScheduleItem } from '../../types';
import { Tabs } from '../../components/common/Tabs';
import { StatusChip } from '../../components/common/StatusChip';
import { EmptyState } from '../../components/common/EmptyState';
import { StudentProfileModal } from '../../components/student/StudentProfileModal';
import {
  Users,
  CalendarCheck,
  FileText,
  FileSpreadsheet,
  Award,
  CalendarDays,
  BarChart3,
  LayoutDashboard,
  UserPlus,
  Upload,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedClassId } = useClass();

  const [cls, setCls] = useState<ClassModel | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected student for 360 profile modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const classId = id || 'cls-10a1';
    setSelectedClassId(classId);

    const loadData = async () => {
      setLoading(true);
      const c = await DataService.getClassById(classId);
      const stus = await DataService.getStudents(classId);
      const asgs = await DataService.getAssignments(classId);
      const att = await DataService.getAttendanceHistory(classId);
      const sch = await DataService.getSchedules(classId);

      setCls(c || null);
      setStudents(stus);
      setAssignments(asgs);
      setAttendanceSessions(att);
      setSchedules(sch);
      setLoading(false);
    };

    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, [id, setSelectedClassId]);

  if (!cls && !loading) {
    return (
      <EmptyState
        title="Không tìm thấy lớp học"
        description="Lớp học có thể đã bị xóa hoặc đường dẫn không hợp lệ."
        actionLabel="Quay lại danh sách lớp"
        onAction={() => navigate('/teacher/classes')}
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Học sinh', badge: students.length, icon: <Users className="w-4 h-4" /> },
    { id: 'attendance', label: 'Điểm danh', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'assignments', label: 'Bài tập', badge: assignments.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'grades', label: 'Sổ điểm', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'behavior', label: 'Thi đua & Hành vi', icon: <Award className="w-4 h-4" /> },
    { id: 'schedule', label: 'Thời khóa biểu', icon: <CalendarDays className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/classes')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{cls?.name}</h1>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                Không gian làm việc chính
              </span>
              <StatusChip status={cls?.status || 'active'} size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phòng: <span className="font-semibold text-slate-700">{cls?.room || 'P201'}</span> • Mã
              lớp: <span className="font-mono font-bold text-blue-600">{cls?.join_code}</span> • Sĩ
              số: <span className="font-semibold text-slate-700">{students.length} học sinh</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Điểm danh</span>
          </button>
          <button
            onClick={() => navigate('/teacher/assignments/create')}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Giao bài</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Thông tin lớp học</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Giáo viên chủ nhiệm</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {cls?.homeroom_teacher_name || 'Cô Trần Thị Mai'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Khối lớp</span>
                  <span className="font-semibold text-slate-800 text-sm">Khối 10 (THPT)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Năm học</span>
                  <span className="font-semibold text-slate-800 text-sm">2025 - 2026</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Tỷ lệ chuyên cần TB</span>
                  <span className="font-semibold text-emerald-600 text-sm">96.4%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Điểm TB môn Toán</span>
                  <span className="font-semibold text-blue-600 text-sm">8.42</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-1">Tỷ lệ nộp bài tập</span>
                  <span className="font-semibold text-purple-600 text-sm">92%</span>
                </div>
              </div>
            </div>

            {/* Recent Attendance Session */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Điểm danh gần nhất</h3>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Xem lịch sử
                </button>
              </div>
              {attendanceSessions.length > 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Ngày {new Date(attendanceSessions[0].date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ghi nhận bởi: {attendanceSessions[0].recorded_by_name} •{' '}
                      {attendanceSessions[0].notes}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-semibold">
                      {attendanceSessions[0].present_count} Có mặt
                    </span>
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-semibold">
                      {attendanceSessions[0].absent_excused_count} Vắng
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa có bản ghi điểm danh nào.</p>
              )}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Thao tác cho lớp</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/teacher/students/create')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 flex items-center gap-3 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">Thêm học sinh mới</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/students/import')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 flex items-center gap-3 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800">Nhập danh sách Excel</span>
                </button>
                <button
                  onClick={() => navigate('/teacher/grades')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-slate-800">Mở bảng điểm lớp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Students */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              Danh sách học sinh ({students.length})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/teacher/students/import')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={() => navigate('/teacher/students/create')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm học sinh</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Mã số</th>
                <th className="px-4 py-3">Phụ huynh</th>
                <th className="px-4 py-3">Chuyên cần</th>
                <th className="px-4 py-3">Điểm TB</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={s.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{s.full_name}</p>
                        <p className="text-[11px] text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">{s.student_code}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{s.parent_name || 'Chưa cập nhật'}</p>
                    <p className="text-[11px] text-slate-400">{s.parent_phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-600">{s.attendance_rate}%</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600">{s.gpa}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Hồ sơ 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Lịch sử các buổi điểm danh</h3>
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Thực hiện điểm danh hôm nay
            </button>
          </div>

          <div className="space-y-3">
            {attendanceSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    Ngày {new Date(session.date).toLocaleDateString('vi-VN')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{session.notes}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg">
                    Có mặt: {session.present_count}
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-lg">
                    Nghỉ phép: {session.absent_excused_count}
                  </span>
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 font-semibold text-xs rounded-lg">
                    Đi trễ: {session.late_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Danh sách bài tập của lớp</h3>
            <button
              onClick={() => navigate('/teacher/assignments/create')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Giao bài tập mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {asg.subject_name}
                    </span>
                    <StatusChip status={asg.status} size="sm" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{asg.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asg.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Đã nộp: <strong className="text-slate-800">{asg.submitted_count}</strong>/
                    {asg.total_students}
                  </span>
                  <button
                    onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Chấm bài →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Schedule */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thời khóa biểu lớp {cls?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Lịch học các tiết trong tuần của lớp {cls?.name}
              </p>
            </div>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Mở Thời khóa biểu đầy đủ & Chỉnh sửa</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schedules.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 transition-all">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1">
                  <span className="font-bold text-blue-700">Thứ {item.day_of_week} • Tiết {item.period_number}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{item.start_time} - {item.end_time}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{item.subject_name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  GV: {item.teacher_name} • Phòng: {item.room}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Grades & Behavior placeholder redirects */}
      {activeTab === 'grades' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Sổ điểm điện tử</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Nhập điểm theo định dạng bảng tính spreadsheet với tính năng validate điểm và tính điểm trung bình môn tự động.
          </p>
          <button
            onClick={() => navigate('/teacher/grades')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
          >
            Mở giao diện Sổ điểm đầy đủ
          </button>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Award className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Thi đua & Khen thưởng</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Ghi nhận điểm cộng rèn luyện, huy hiệu danh dự và các lưu ý kỷ luật của học sinh trong lớp.
          </p>
          <button
            onClick={() => navigate('/teacher/behavior')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
          >
            Đến trang Quản lý Thi đua
          </button>
        </div>
      )}

      {/* 360 Student Profile Quick View Modal */}
      <StudentProfileModal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
};
