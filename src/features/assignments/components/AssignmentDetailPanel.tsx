import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarPlus,
  Copy,
  Edit3,
  FileDown,
  FileText,
  History,
  Lock,
  Unlock,
  Mail,
  RotateCcw,
  Send,
  Users,
  Search,
  AlertTriangle,
  Award,
  BarChart3,
  Eye,
  Paperclip,
  UserCheck,
  Clock,
  X
} from 'lucide-react';
import {
  AssignmentComputedStats,
  AssignmentPermissions,
  RecipientStudentRow,
  RecipientTab,
  RecipientTabCounts
} from '../../../services/assignmentManagementService';
import { Assignment, AssignmentEvent, GradeRevision, Student, Submission } from '../../../types';
import {
  formatDateTimeVN,
  formatDelayDuration,
  getAssignmentTypeLabel,
  getGradeStatusMeta,
  getGradingPolicyLabel,
  getReceiveStatusMeta,
  getSubmissionStatusMeta
} from '../utils/formatters';

const EVENT_TYPE_LABELS: Record<string, string> = {
  create: 'Tạo bài tập',
  edit_metadata: 'Cập nhật thông tin',
  extend: 'Gia hạn nộp bài',
  remind: 'Gửi nhắc nộp',
  close: 'Đóng nhận bài',
  reopen: 'Mở lại nhận bài',
  withdraw: 'Thu hồi bài tập',
  duplicate: 'Sao chép bản nháp',
  reassign: 'Giao lại sang lớp khác',
  publish_grades: 'Công bố điểm / Trả bài',
  request_resubmit: 'Yêu cầu làm lại',
  grade: 'Chấm điểm bài làm',
  revise_grade: 'Sửa điểm (Audit)',
  direct_submit: 'Ghi nhận nộp trực tiếp'
};

interface AssignmentDetailPanelProps {
  assignment: Assignment | null;
  stats: AssignmentComputedStats | null;
  permissions: AssignmentPermissions | null;
  events: AssignmentEvent[];
  revisions: GradeRevision[];
  publishableSubmissionIds: string[];
  unsubmittedStudentIds: string[];
  recipientRows: RecipientStudentRow[];
  tabCounts: RecipientTabCounts;
  activeTab: RecipientTab;
  onTabChange: (tab: RecipientTab) => void;
  onlyPendingGrade: boolean;
  onOnlyPendingGradeChange: (val: boolean) => void;
  studentSearch: string;
  onStudentSearchChange: (val: string) => void;
  selectedStudentIds: string[];
  onToggleStudent: (studentId: string) => void;
  onSelectAllVisibleStudents: () => void;
  onClearStudentSelection: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onBackMobile?: () => void;
  onOpenReport: (assignmentId: string) => void;
  // Actions mapped to ACT-01..ACT-20
  onOpenEditMetadata: () => void;
  onOpenExtend: (studentIds?: string[]) => void;
  onOpenCloseOrReopen: (mode: 'close' | 'reopen') => void;
  onOpenWithdraw: () => void;
  onOpenDuplicateOrReassign: (mode: 'copy' | 'reassign') => void;
  onOpenRemind: (studentIds: string[]) => void;
  onOpenPublish: (submissionIds: string[]) => void;
  onOpenRequestResubmit: (studentIds: string[]) => void;
  onOpenDirectRecord: (student: Student) => void;
  onOpenExport: () => void;
  onOpenGradingWorkspace: (submission: Submission) => void;
  onOpenReviseGrade: (submission: Submission) => void;
}

export const AssignmentDetailPanel: React.FC<AssignmentDetailPanelProps> = ({
  assignment,
  stats,
  permissions,
  events,
  revisions,
  publishableSubmissionIds,
  unsubmittedStudentIds,
  recipientRows,
  tabCounts,
  activeTab,
  onTabChange,
  onlyPendingGrade,
  onOnlyPendingGradeChange,
  studentSearch,
  onStudentSearchChange,
  selectedStudentIds,
  onToggleStudent,
  onSelectAllVisibleStudents,
  onClearStudentSelection,
  isLoading,
  error,
  onRetry,
  onBackMobile,
  onOpenReport,
  onOpenEditMetadata,
  onOpenExtend,
  onOpenCloseOrReopen,
  onOpenWithdraw,
  onOpenDuplicateOrReassign,
  onOpenRemind,
  onOpenPublish,
  onOpenRequestResubmit,
  onOpenDirectRecord,
  onOpenExport,
  onOpenGradingWorkspace,
  onOpenReviseGrade
}) => {
  const [subView, setSubView] = useState<'students' | 'config' | 'audit'>('students');

  if (isLoading && !assignment) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-5 space-y-4 animate-pulse">
        <div className="h-6 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 shadow-xs rounded-[14px] p-6 text-center space-y-3"
      >
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" aria-hidden="true" />
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
        >
          Tải lại chi tiết
        </button>
      </div>
    );
  }

  if (!assignment || !stats || !permissions) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-10 text-center space-y-2">
        <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto opacity-75" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Chọn một bài tập ở danh sách bên trái</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chi tiết lượt giao, danh sách học sinh, bài nộp và công cụ chấm điểm sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  const receiveMeta = getReceiveStatusMeta(stats.effectiveReceiveStatus, {
    isPastDue: stats.isPastDueNow,
    allowLate: assignment.allow_late
  });

  const tabs: Array<{ id: RecipientTab; label: string; count: number }> = [
    { id: 'all', label: 'Tất cả', count: tabCounts.all },
    { id: 'submitted', label: 'Đã nộp', count: tabCounts.submitted },
    { id: 'unsubmitted', label: 'Chưa nộp', count: tabCounts.unsubmitted },
    { id: 'late', label: 'Nộp muộn', count: tabCounts.late },
    { id: 'graded', label: 'Đã chấm', count: tabCounts.graded }
  ];

  const allVisibleSelected =
    recipientRows.length > 0 &&
    recipientRows.every((r) => selectedStudentIds.includes(r.student.id));

  const selectedRows = recipientRows.filter((r) => selectedStudentIds.includes(r.student.id));
  const selectedUnsubmittedIds = selectedRows.filter((r) => !r.isSubmitted).map((r) => r.student.id);
  const selectedPublishableSubmissionIds = selectedRows
    .filter((r) => r.officialSubmission && r.gradeStatus === 'graded')
    .map((r) => r.officialSubmission!.id);
  const selectedSubmittedIds = selectedRows.filter((r) => r.isSubmitted).map((r) => r.student.id);

  // Assignment-wide publishable graded submissions (not limited by current tab/search)
  const allPublishableSubmissionIds = publishableSubmissionIds;

  // Map grade revisions per submission id
  const revisionsBySubmissionId = new Map<string, GradeRevision[]>();
  revisions.forEach((rev) => {
    const arr = revisionsBySubmissionId.get(rev.submission_id) || [];
    arr.push(rev);
    revisionsBySubmissionId.set(rev.submission_id, arr);
  });

  const emptyTabMessages: Record<RecipientTab, { title: string; desc: string }> = {
    all: {
      title: 'Không tìm thấy học sinh nào',
      desc: studentSearch ? 'Không có học sinh khớp với từ khóa tìm kiếm.' : 'Lớp hiện chưa có danh sách học sinh nhận bài.'
    },
    submitted: {
      title: onlyPendingGrade ? 'Không còn bài chưa chấm' : 'Chưa có học sinh nào nộp bài',
      desc: onlyPendingGrade
        ? 'Tất cả bài đã nộp trong lượt giao này đều đã được chấm xong.'
        : 'Các bài nộp hợp lệ (kể cả nộp muộn) sẽ xuất hiện tại đây.'
    },
    unsubmitted: {
      title: '100% học sinh đã nộp bài',
      desc: 'Không còn học sinh nào chưa nộp bài tập này.'
    },
    late: {
      title: 'Không có học sinh nộp muộn',
      desc: 'Tất cả bài đã nộp đều nằm trong thời hạn hiệu lực.'
    },
    graded: {
      title: 'Chưa có bài nào hoàn tất chấm điểm',
      desc: 'Chuyển sang tab Đã nộp để xem bài làm và chấm điểm cho học sinh.'
    }
  };

  const formatEventSummary = (ev: AssignmentEvent): string => {
    const p = ev.payload || {};
    if (ev.event_type === 'extend') {
      return `${p.scope === 'individual' ? `Gia hạn riêng ${p.student_ids?.length || 0} HS` : 'Gia hạn toàn lớp'} đến ${formatDateTimeVN(p.new_due_at)}${p.reason ? ` — ${p.reason}` : ''}`;
    }
    if (ev.event_type === 'remind') {
      return `Đã gửi: ${p.sentCount ?? 0} · Bỏ qua trùng: ${p.skippedDuplicateCount ?? 0} · Lỗi: ${p.failedCount ?? 0}`;
    }
    if (ev.event_type === 'grade') {
      return `${p.student_name || p.student_id}: ${p.score ?? '—'}/${assignment.points_max}đ (${getGradeStatusMeta(p.grade_status || 'graded').label})`;
    }
    if (ev.event_type === 'revise_grade') {
      return `${p.student_name || ''}: ${p.old_score ?? '—'} → ${p.new_score}đ${p.reason ? ` — ${p.reason}` : ''}`;
    }
    if (ev.event_type === 'direct_submit') {
      return `${p.student_name || p.student_id}${p.score !== null && p.score !== undefined ? ` (${p.score}đ)` : ''} — ${p.note || ''}`;
    }
    if (ev.event_type === 'publish') {
      if (p.publishedCount !== undefined) {
        return `Trả bài & công bố ${p.publishedCount} bài (${p.notify ? 'có gửi thông báo' : 'không gửi thông báo'})`;
      }
      return 'Công bố bài tập cho lớp.';
    }
    if (ev.event_type === 'request_resubmit') {
      return `Cấp thêm +${p.extra_attempts ?? 1} lượt cho ${p.student_ids?.length || 0} HS — ${p.reason || ''}`;
    }
    if (p.reason) return String(p.reason);
    if (p.title) return `Tiêu đề: ${p.title}`;
    return Object.keys(p).length > 0 ? JSON.stringify(p) : 'Đã thực hiện thao tác.';
  };

  return (
    <section
      aria-label={`Chi tiết bài tập: ${assignment.title}`}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-4 sm:p-5 space-y-4"
    >
      {/* Mobile back button */}
      {onBackMobile && (
        <button
          type="button"
          onClick={onBackMobile}
          className="md:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài tập</span>
        </button>
      )}

      {/* Detail Header: Title & Metadata ONLY (Separated cleanly from Action Toolbar) */}
      <div className="space-y-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{assignment.code || assignment.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{assignment.class_name}</span>
            <span aria-hidden="true">·</span>
            <span>{assignment.subject_name}</span>
            <span aria-hidden="true">·</span>
            <span>{getAssignmentTypeLabel(assignment.type)}</span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${receiveMeta.className}`}
          >
            {receiveMeta.isPastDueOpen && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
            <span>{receiveMeta.label}</span>
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
          {assignment.title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <span className={`inline-flex items-center gap-1 ${stats.isOverdueNow ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}`}>
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Hạn mặc định: {formatDateTimeVN(assignment.due_date)}</span>
          </span>
          <span>Thang điểm: {assignment.points_max}đ (bước {assignment.score_step || 0.25})</span>
          <span>Nộp tối đa: {assignment.max_attempts || 3} lượt</span>
          <span>Sĩ số nhận bài: {stats.totalStudents} HS</span>
          <span>Phiên bản: v{assignment.version || 1}</span>
        </div>
      </div>

      {/* Dedicated Action Toolbar (Separated below Header to avoid crowding the Title) */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800"
        role="toolbar"
        aria-label="Thanh thao tác bài tập"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {allPublishableSubmissionIds.length > 0 && permissions.canPublish && (
            <button
              type="button"
              onClick={() => onOpenPublish(allPublishableSubmissionIds)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trả bài ({allPublishableSubmissionIds.length})</span>
            </button>
          )}

          {permissions.canRemind && unsubmittedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenRemind(unsubmittedStudentIds)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Nhắc chưa nộp ({unsubmittedStudentIds.length})</span>
            </button>
          )}

          {permissions.canExtend && (
            <button
              type="button"
              onClick={() => onOpenExtend(undefined)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Gia hạn lớp</span>
            </button>
          )}

          {permissions.canEditMetadata && (
            <button
              type="button"
              onClick={onOpenEditMetadata}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sửa thông tin</span>
            </button>
          )}

          {permissions.canDuplicate && (
            <button
              type="button"
              onClick={() => onOpenDuplicateOrReassign('copy')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Sao chép</span>
            </button>
          )}

          {permissions.canReassign && (
            <button
              type="button"
              onClick={() => onOpenDuplicateOrReassign('reassign')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Giao lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenReport(assignment.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Báo cáo bài</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Xuất dữ liệu</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {permissions.canClose && (
            <button
              type="button"
              onClick={() => onOpenCloseOrReopen('close')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đóng nhận bài</span>
            </button>
          )}

          {permissions.canReopen && (
            <button
              type="button"
              onClick={() => onOpenCloseOrReopen('reopen')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở lại nhận bài</span>
            </button>
          )}

          {permissions.canWithdraw && (
            <button
              type="button"
              onClick={onOpenWithdraw}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thu hồi</span>
            </button>
          )}
        </div>
      </div>

      {/* Per-Assignment Mini KPIs (Single Source of Truth) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Đã nộp</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.submissionRate !== null ? `${stats.submissionRate}%` : '—'}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({stats.submittedCount}/{stats.totalStudents})
            </span>
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Chưa chấm</span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.pendingGradeCount} bài
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Nộp muộn</span>
          <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.lateCount} học sinh
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Điểm trung bình</span>
          <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {stats.averageScore !== null ? `${stats.averageScore} / ${assignment.points_max}` : '—'}
          </span>
        </div>
      </div>

      {/* Secondary switcher: Student List vs Config/Questions vs Audit Events */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'students'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Theo dõi học sinh ({tabCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSubView('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'config'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Cấu hình & Nội dung đề ({assignment.questions?.length || assignment.total_questions || 0})
          </button>
          <button
            type="button"
            onClick={() => setSubView('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'audit'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Lịch sử tác động & Sửa điểm ({events.length + revisions.length})
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: 5 STUDENT TABS & TABLE */}
      {subView === 'students' && (
        <div className="space-y-3">
          {/* 5 Student Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[11px] tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick filter Chưa chấm inside Đã nộp */}
            {activeTab === 'submitted' && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyPendingGrade}
                  onChange={(e) => onOnlyPendingGradeChange(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                />
                <span>Chỉ hiện bài chưa chấm ({tabCounts.pendingGrade})</span>
              </label>
            )}
          </div>

          {/* Search students + Quick Unsubmitted Tab CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => onStudentSearchChange(e.target.value)}
                placeholder="Tìm tên hoặc mã học sinh..."
                aria-label="Tìm học sinh trong danh sách nhận bài"
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => onStudentSearchChange('')}
                  aria-label="Xóa tìm kiếm học sinh"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'unsubmitted' && recipientRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {permissions.canRemind && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenRemind(
                        selectedUnsubmittedIds.length > 0
                          ? selectedUnsubmittedIds
                          : recipientRows.map((r) => r.student.id)
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {selectedUnsubmittedIds.length > 0
                        ? `Nhắc ${selectedUnsubmittedIds.length} HS đã chọn`
                        : `Nhắc toàn bộ chưa nộp (${recipientRows.length})`}
                    </span>
                  </button>
                )}

                {permissions.canExtend && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenExtend(
                        selectedUnsubmittedIds.length > 0
                          ? selectedUnsubmittedIds
                          : recipientRows.map((r) => r.student.id)
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-blue-700 dark:text-blue-400 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      {selectedUnsubmittedIds.length > 0
                        ? `Gia hạn ${selectedUnsubmittedIds.length} HS`
                        : `Gia hạn nhóm chưa nộp (${recipientRows.length})`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {activeTab === 'unsubmitted' && stats.effectiveReceiveStatus === 'closed' && recipientRows.length > 0 && (
            <div className="px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex flex-wrap items-center justify-between gap-2">
              <span>
                Bài tập đang ở trạng thái <strong>Đã đóng nhận</strong>. Bạn có thể mở lại nhận bài hoặc dùng{' '}
                <strong>Ghi nhận nộp / Chấm</strong> cho học sinh nộp trực tiếp trên lớp.
              </span>
              {permissions.canReopen && (
                <button
                  type="button"
                  onClick={() => onOpenCloseOrReopen('reopen')}
                  className="underline font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 cursor-pointer"
                >
                  Mở lại nhận bài
                </button>
              )}
            </div>
          )}

          {/* Floating / Inline Batch Action Bar when >= 1 student selected */}
          {selectedStudentIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100 font-semibold">
                <span>Đã chọn {selectedStudentIds.length} học sinh</span>
                <button
                  type="button"
                  onClick={onClearStudentSelection}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 underline text-[11px] font-normal cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedUnsubmittedIds.length > 0 && permissions.canRemind && (
                  <button
                    type="button"
                    onClick={() => onOpenRemind(selectedUnsubmittedIds)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    Nhắc nộp ({selectedUnsubmittedIds.length})
                  </button>
                )}
                {permissions.canExtend && (
                  <button
                    type="button"
                    onClick={() => onOpenExtend(selectedStudentIds)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Gia hạn riêng ({selectedStudentIds.length})
                  </button>
                )}
                {selectedPublishableSubmissionIds.length > 0 && permissions.canPublish && (
                  <button
                    type="button"
                    onClick={() => onOpenPublish(selectedPublishableSubmissionIds)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Công bố điểm ({selectedPublishableSubmissionIds.length})
                  </button>
                )}
                {selectedSubmittedIds.length > 0 && permissions.canRequestResubmit && (
                  <button
                    type="button"
                    onClick={() => onOpenRequestResubmit(selectedSubmittedIds)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100/60 dark:hover:bg-blue-950/50 cursor-pointer"
                  >
                    Yêu cầu làm lại ({selectedSubmittedIds.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recipient Rows Table / Empty */}
          {recipientRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-8 text-center space-y-1.5">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emptyTabMessages[activeTab].title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{emptyTabMessages[activeTab].desc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 w-9">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={onSelectAllVisibleStudents}
                        aria-label="Chọn tất cả học sinh đang hiển thị"
                        className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2.5">Học sinh</th>
                    <th className="px-3 py-2.5">Nộp bài & Thời hạn</th>
                    <th className="px-3 py-2.5">Điểm & Trạng thái chấm</th>
                    <th className="px-3 py-2.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recipientRows.map((row) => {
                    const isChecked = selectedStudentIds.includes(row.student.id);
                    const subMeta = getSubmissionStatusMeta(row.isSubmitted, row.isLate);
                    const gMeta = getGradeStatusMeta(row.gradeStatus);
                    const rowRevisions = row.officialSubmission
                      ? revisionsBySubmissionId.get(row.officialSubmission.id) || []
                      : [];
                    const isRowPastDue = new Date(row.effectiveDueAt).getTime() < Date.now();

                    return (
                      <tr
                        key={row.student.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleStudent(row.student.id)}
                            aria-label={`Chọn học sinh ${row.student.full_name}`}
                            className="mt-0.5 w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                          />
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.student.full_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{row.student.student_code}</span>
                            {row.attemptCount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {row.attemptCount} lượt nộp
                                  {row.officialSubmission?.attempt_no
                                    ? ` (tính lần ${row.officialSubmission.attempt_no})`
                                    : ''}
                                </span>
                              </>
                            )}
                          </div>
                          {row.reminderCount > 0 && (
                            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                              Đã nhắc {row.reminderCount} lần ({formatDateTimeVN(row.lastRemindedAt)})
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top space-y-1">
                          {row.isSubmitted && row.officialSubmission ? (
                            <>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${subMeta.className}`}
                                >
                                  {subMeta.label}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                  · {formatDateTimeVN(row.officialSubmission.submitted_at)}
                                </span>
                              </div>
                              {row.isLate && (
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                  {formatDelayDuration(row.delayMinutes)}
                                </div>
                              )}
                              {row.officialSubmission.submission_source === 'offline_teacher' && (
                                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                  Ghi nhận nộp trực tiếp
                                </div>
                              )}
                              {row.officialSubmission.files && row.officialSubmission.files.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenGradingWorkspace(row.officialSubmission!)}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[230px] cursor-pointer"
                                  title="Mở xem tệp đính kèm & bài làm"
                                >
                                  <Paperclip className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    Xem file: {row.officialSubmission.files[0].name}
                                    {row.officialSubmission.files.length > 1
                                      ? ` (+${row.officialSubmission.files.length - 1})`
                                      : ''}
                                  </span>
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${subMeta.className}`}
                                >
                                  {subMeta.label}
                                </span>
                                <span
                                  className={`text-[11px] font-medium ${
                                    isRowPastDue ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                                  }`}
                                >
                                  {isRowPastDue ? 'Quá hạn' : 'Còn hạn'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block tabular-nums">
                                Hạn hiệu lực: {formatDateTimeVN(row.effectiveDueAt)}
                              </span>
                            </div>
                          )}

                          {row.hasPersonalExtension && (
                            <span className="inline-block text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              Đã gia hạn riêng đến {formatDateTimeVN(row.effectiveDueAt)}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top space-y-1">
                          {row.isSubmitted ? (
                            <>
                              <div className="flex items-center gap-2">
                                {row.effectiveScore !== null ? (
                                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                                    {row.effectiveScore}/{assignment.points_max}đ
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${gMeta.className}`}
                                >
                                  {gMeta.label}
                                </span>
                                {rowRevisions.length > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[10px] font-medium text-amber-800 dark:text-amber-300"
                                    title={`Điểm đã được sửa ${rowRevisions.length} lần`}
                                  >
                                    <History className="w-2.5 h-2.5" />
                                    <span>Đã sửa {rowRevisions.length} lần</span>
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-top text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {row.isSubmitted && row.officialSubmission ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOpenGradingWorkspace(row.officialSubmission!)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer inline-flex items-center gap-1"
                                >
                                  {row.gradeStatus === 'graded' || row.gradeStatus === 'published' ? (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      <span>Xem bài</span>
                                    </>
                                  ) : (
                                    <>
                                      <Award className="w-3 h-3" />
                                      <span>Chấm bài</span>
                                    </>
                                  )}
                                </button>

                                {row.canRevise && permissions.canReviseGrade && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenReviseGrade(row.officialSubmission!)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    Sửa điểm
                                  </button>
                                )}

                                {row.canPublish && permissions.canPublish && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPublish([row.officialSubmission!.id])}
                                    className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    Trả bài
                                  </button>
                                )}

                                {permissions.canRequestResubmit && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenRequestResubmit([row.student.id])}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap cursor-pointer"
                                    title="Yêu cầu làm lại"
                                  >
                                    Làm lại
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {row.canRemind && permissions.canRemind && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenRemind([row.student.id])}
                                    className="px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    Nhắc nộp
                                  </button>
                                )}
                                {row.canExtend && permissions.canExtend && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenExtend([row.student.id])}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    Gia hạn riêng
                                  </button>
                                )}
                                {permissions.canGrade && stats.effectiveReceiveStatus !== 'draft' && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenDirectRecord(row.student)}
                                    className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium whitespace-nowrap cursor-pointer inline-flex items-center gap-1"
                                    title="Ghi nhận học sinh nộp vở/bài giấy trực tiếp và chấm điểm"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    <span>Nộp trực tiếp</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: CONFIGURATION & QUESTIONS */}
      {subView === 'config' && (
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Quy chế tính điểm khi nộp nhiều lần:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {getGradingPolicyLabel(assignment.grading_policy)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Nộp muộn & Bước điểm:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {assignment.allow_late ? 'Cho phép (gắn nhãn nộp muộn)' : 'Không cho phép'} · Bước{' '}
                {assignment.score_step || 0.25}đ
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Thời gian mở nhận bài:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTimeVN(assignment.opens_at || assignment.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Phiên bản nội dung đề:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">v{assignment.content_version || 1}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Mô tả & Yêu cầu bài làm</h4>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {assignment.description || 'Không có mô tả bổ sung.'}
            </p>
            {assignment.special_instructions && (
              <p className="text-blue-700 dark:text-blue-400 text-[11px] pt-1.5 border-t border-slate-200 dark:border-slate-700">
                Ghi chú riêng: {assignment.special_instructions}
              </p>
            )}
          </div>

          {assignment.questions && assignment.questions.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Danh sách câu hỏi ({assignment.questions.length} câu)
              </h4>
              {assignment.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Câu {idx + 1}: {q.question_text}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      {q.points || 2}đ
                    </span>
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.correct_answer && (
                    <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Đáp án chuẩn: {q.correct_answer}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: AUDIT EVENTS & GRADE REVISIONS */}
      {subView === 'audit' && (
        <div className="space-y-4">
          {revisions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Lịch sử sửa điểm bất biến ({revisions.length})</span>
              </h4>
              <div className="divide-y divide-amber-100 dark:divide-amber-900/50 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30">
                {revisions.map((rev) => (
                  <div key={rev.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-amber-800 dark:text-amber-300">
                          {rev.old_score ?? '—'} → {rev.new_score}đ
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">bởi {rev.changed_by}</span>
                        <span className="text-[11px] font-mono text-slate-400">({rev.submission_id})</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">Lý do: {rev.reason}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDateTimeVN(rev.changed_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Nhật ký tác động hệ thống ({events.length})</span>
            </h4>
            {events.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Chưa có sự kiện thay đổi nào được ghi nhận cho bài tập này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">bởi {ev.actor_name}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">{formatEventSummary(ev)}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {formatDateTimeVN(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
