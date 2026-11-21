import React from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, Clock, FileDown, History, Users } from 'lucide-react';
import {
  AssignmentComputedStats,
  RecipientStudentRow
} from '../../../services/assignmentManagementService';
import { Assignment, AssignmentEvent, GradeRevision } from '../../../types';
import { formatDateTimeVN, getGradeStatusMeta, getReceiveStatusMeta, getSubmissionStatusMeta } from '../utils/formatters';

interface AssignmentReportViewProps {
  assignment: Assignment;
  stats: AssignmentComputedStats;
  rows: RecipientStudentRow[];
  events: AssignmentEvent[];
  revisions: GradeRevision[];
  onBack: () => void;
  onExport: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  create: 'Tạo bài tập',
  edit_metadata: 'Cập nhật thông tin',
  extend: 'Gia hạn nộp bài',
  remind: 'Gửi nhắc nộp',
  close: 'Đóng nhận bài',
  reopen: 'Mở lại nhận bài',
  withdraw: 'Thu hồi bài tập',
  duplicate: 'Sao chép bản nháp',
  reassign: 'Giao lại cho lớp',
  publish_grades: 'Công bố điểm',
  request_resubmit: 'Yêu cầu làm lại',
  grade: 'Chấm điểm',
  revise_grade: 'Sửa điểm (Audit)',
  direct_submit: 'Ghi nhận nộp trực tiếp'
};

export const AssignmentReportView: React.FC<AssignmentReportViewProps> = ({
  assignment,
  stats,
  rows,
  events,
  revisions,
  onBack,
  onExport
}) => {
  const receiveMeta = getReceiveStatusMeta(stats.effectiveReceiveStatus, {
    isPastDue: stats.isPastDueNow,
    allowLate: assignment.allow_late
  });

  const maxScore = assignment.points_max || 10;
  const roundScore = (val: number) => Math.round(val * 100) / 100;
  const tExcellent = roundScore(maxScore * 0.8);
  const tGood = roundScore(maxScore * 0.65);
  const tAvg = roundScore(maxScore * 0.5);

  // Score bands distribution across graded/published valid scores (normalized to points_max)
  const gradedScores = rows
    .filter((r) => (r.gradeStatus === 'graded' || r.gradeStatus === 'published') && r.effectiveScore !== null)
    .map((r) => r.effectiveScore as number);

  const bands = [
    {
      label: `Giỏi (${tExcellent} – ${maxScore}đ)`,
      count: gradedScores.filter((s) => s >= tExcellent).length,
      color: 'bg-emerald-500'
    },
    {
      label: `Khá (${tGood} – < ${tExcellent}đ)`,
      count: gradedScores.filter((s) => s >= tGood && s < tExcellent).length,
      color: 'bg-blue-600'
    },
    {
      label: `Trung bình (${tAvg} – < ${tGood}đ)`,
      count: gradedScores.filter((s) => s >= tAvg && s < tGood).length,
      color: 'bg-amber-500'
    },
    {
      label: `Cần cố gắng (< ${tAvg}đ)`,
      count: gradedScores.filter((s) => s < tAvg).length,
      color: 'bg-rose-500'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Danh sách bài tập đã giao</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Báo cáo lượt giao: {assignment.title}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${receiveMeta.className}`}
            >
              {receiveMeta.label}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {assignment.class_name} · {assignment.subject_name} · Hạn: {formatDateTimeVN(assignment.due_date)}
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          <FileDown className="w-4 h-4" />
          <span>Xuất báo cáo (CSV / JSON)</span>
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[12px] p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng học sinh giao</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{stats.totalStudents}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[12px] p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tỷ lệ nộp</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {stats.submissionRate !== null ? `${stats.submissionRate}%` : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[12px] p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đã chấm / Đã nộp</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {stats.gradedCount}/{stats.submittedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[12px] p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Nộp muộn</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{stats.lateCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[12px] p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Điểm trung bình (đã chấm)</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {stats.averageScore !== null ? `${stats.averageScore}/${maxScore}` : '—'}
          </p>
        </div>
      </div>

      {/* Score distribution + Grade revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Phân bố điểm số ({gradedScores.length} bài có điểm hợp lệ)</span>
            </h2>
          </div>
          {gradedScores.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
              Chưa có bài nộp nào được chấm hoàn tất để thống kê phổ điểm.
            </p>
          ) : (
            <div className="space-y-3">
              {bands.map((b) => {
                const pct = Math.round((b.count / gradedScores.length) * 100);
                return (
                  <div key={b.label} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 tabular-nums">
                      <span>{b.label}</span>
                      <span>
                        <strong className="text-slate-900 dark:text-slate-100">{b.count}</strong> HS ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Nhật ký sửa điểm & Sự kiện gần đây</span>
          </h2>
          {revisions.length === 0 && events.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">Chưa có biến động nào được ghi nhận.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5"
                >
                  <div className="flex justify-between text-slate-800 dark:text-slate-100">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Sửa điểm: {rev.old_score ?? '—'} → {rev.new_score}đ
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateTimeVN(rev.changed_at)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">Lý do: {rev.reason} · Bởi {rev.changed_by}</p>
                </div>
              ))}
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {EVENT_LABELS[ev.event_type] || ev.event_type}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 ml-2">bởi {ev.actor_name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">{formatDateTimeVN(ev.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Student Summary Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Bảng tổng hợp từng học sinh</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="px-3 py-2.5">Mã HS</th>
                <th className="px-3 py-2.5">Họ và tên</th>
                <th className="px-3 py-2.5">Trạng thái nộp</th>
                <th className="px-3 py-2.5">Số lượt</th>
                <th className="px-3 py-2.5">Điểm</th>
                <th className="px-3 py-2.5">Trạng thái điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => {
                const subMeta = getSubmissionStatusMeta(r.isSubmitted, r.isLate);
                const gMeta = getGradeStatusMeta(r.gradeStatus);
                return (
                  <tr key={r.student.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{r.student.student_code}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{r.student.full_name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${subMeta.className}`}
                      >
                        {subMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.attemptCount}</td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {r.effectiveScore !== null ? `${r.effectiveScore}/${maxScore}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {r.isSubmitted ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${gMeta.className}`}
                        >
                          {gMeta.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
