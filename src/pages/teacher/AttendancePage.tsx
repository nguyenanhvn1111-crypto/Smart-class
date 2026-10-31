import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Student, AttendanceStatus, AttendanceSession } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  History,
  Save,
  CheckCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  Users
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const [date, setDate] = useState<string>('2026-10-04');
  const [sessionType, setSessionType] = useState<string>('daily');
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // History drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<AttendanceSession[]>([]);

  // Load students and current attendance record
  useEffect(() => {
    const loadSession = async () => {
      const stus = await DataService.getStudents(selectedClassId);
      setStudents(stus);

      const existingSession = await DataService.getAttendanceSession(selectedClassId, date);
      const initialMap: Record<string, { status: AttendanceStatus; note: string }> = {};

      if (existingSession && existingSession.records) {
        setNotes(existingSession.notes || '');
        existingSession.records.forEach((r) => {
          initialMap[r.student_id] = { status: r.status, note: r.note || '' };
        });
      } else {
        // Default: all present
        stus.forEach((s) => {
          initialMap[s.id] = { status: 'present', note: '' };
        });
        setNotes('');
      }

      setRecords(initialMap);
      setHasUnsavedChanges(false);
    };

    loadSession();
  }, [selectedClassId, date]);

  // Load history
  const loadHistory = async () => {
    const hist = await DataService.getAttendanceHistory(selectedClassId);
    setHistoryList(hist);
    setHistoryOpen(true);
  };

  // Status updates
  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { note: '' }),
        status
      }
    }));
    setHasUnsavedChanges(true);
  };

  const setStudentNote = (studentId: string, note: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        note
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach((s) => {
      updated[s.id] = { status: 'present', note: records[s.id]?.note || '' };
    });
    setRecords(updated);
    setHasUnsavedChanges(true);
  };

  // Real-time calculated counters
  let present = 0,
    excused = 0,
    unexcused = 0,
    late = 0,
    early = 0;

  Object.values(records).forEach((r) => {
    if (r.status === 'present') present++;
    if (r.status === 'absent_excused') excused++;
    if (r.status === 'absent_unexcused') unexcused++;
    if (r.status === 'late') late++;
    if (r.status === 'early_leave') early++;
  });

  const total = students.length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 100;

  // Save attendance
  const handleSave = async () => {
    setIsSaving(true);
    const formatted = Object.entries(records).map(([student_id, val]) => ({
      student_id,
      status: val.status,
      note: val.note
    }));

    await DataService.saveAttendanceSession(selectedClassId, date, notes, formatted);
    setIsSaving(false);
    setHasUnsavedChanges(false);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3000);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Điểm danh Lớp học</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận hiện diện, đi muộn, nghỉ phép và đồng bộ trực tiếp tới phụ huynh học sinh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>Lịch sử điểm danh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
          </button>
        </div>
      </div>

      {/* Control bar: Class, Date, Session type */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn lớp học</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-hidden"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày điểm danh</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Buổi / Tiết học</label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-hidden"
          >
            <option value="daily">Điểm danh đầu giờ (Cả ngày)</option>
            <option value="morning">Buổi Sáng</option>
            <option value="afternoon">Buổi Chiều</option>
            <option value="period">Theo tiết học</option>
          </select>
        </div>
      </div>

      {/* Real-time Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700">Có mặt</span>
            <span className="text-xl font-extrabold text-emerald-900 block">{present}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-700">Nghỉ có phép</span>
            <span className="text-xl font-extrabold text-amber-900 block">{excused}</span>
          </div>
          <Clock className="w-6 h-6 text-amber-500" />
        </div>

        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-700">Không phép</span>
            <span className="text-xl font-extrabold text-rose-900 block">{unexcused}</span>
          </div>
          <XCircle className="w-6 h-6 text-rose-500" />
        </div>

        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-orange-700">Đi trễ</span>
            <span className="text-xl font-extrabold text-orange-900 block">{late}</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>

        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-semibold text-blue-700">Tỷ lệ chuyên cần</span>
            <span className="text-xl font-extrabold text-blue-900 block">{attendanceRate}%</span>
          </div>
          <CalendarCheck className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Sĩ số: <strong className="text-blue-600">{total}</strong> học sinh
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
              ● Chưa lưu thay đổi
            </span>
          )}
        </div>

        <button
          onClick={handleMarkAllPresent}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Đánh dấu tất cả có mặt</span>
        </button>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {students.map((student, index) => {
            const currentRecord = records[student.id] || { status: 'present', note: '' };
            const status = currentRecord.status;

            return (
              <div
                key={student.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <span className="w-6 text-xs font-bold text-slate-400">#{index + 1}</span>
                  <img
                    src={
                      student.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={student.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{student.full_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{student.student_code}</p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, 'present')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-600'
                    }`}
                  >
                    Có mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, 'absent_excused')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      status === 'absent_excused'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-amber-50 text-slate-600'
                    }`}
                  >
                    Có phép
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, 'absent_unexcused')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      status === 'absent_unexcused'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-rose-50 text-slate-600'
                    }`}
                  >
                    Không phép
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, 'late')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      status === 'late'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-orange-50 text-slate-600'
                    }`}
                  >
                    Đi trễ
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, 'early_leave')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      status === 'early_leave'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-purple-50 text-slate-600'
                    }`}
                  >
                    Về sớm
                  </button>
                </div>

                {/* Note / reason input */}
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    value={currentRecord.note}
                    onChange={(e) => setStudentNote(student.id, e.target.value)}
                    placeholder="Ghi chú (lý do nghỉ, giờ vào...)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-hidden focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Notes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Nhật ký chung của buổi học
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Nhập ghi chú chung về trật tự lớp, các trường hợp đặc biệt cần lưu ý..."
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:bg-white focus:border-blue-500"
        />
      </div>

      {/* Mobile Sticky Save Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            Có mặt: {present}/{total}
          </span>
          <span className="text-[10px] text-slate-500">{attendanceRate}% tỷ lệ</span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
        </button>
      </div>

      {/* Success Toast */}
      {savedSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Điểm danh đã được lưu và cập nhật vào hệ thống!</span>
        </div>
      )}

      {/* History Drawer */}
      <Drawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Lịch sử điểm danh"
        subtitle={`Nhật ký điểm danh lớp ${currentClass.name}`}
        width="md"
      >
        <div className="space-y-3">
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setDate(item.date);
                setHistoryOpen(false);
              }}
              className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">
                  Ngày {new Date(item.date).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.recorded_by_name || 'Giáo viên'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{item.notes}</p>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                  {item.present_count} Có mặt
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold">
                  {item.absent_excused_count} Vắng
                </span>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-semibold">
                  {item.late_count} Đi trễ
                </span>
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};
