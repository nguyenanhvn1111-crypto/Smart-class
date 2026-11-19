import React, { useEffect, useState } from 'react';
import {
  Clock,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Send,
  CalendarPlus,
  Lock,
  Unlock,
  RotateCcw,
  FileDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Plus,
  BarChart3,
  Mail,
  AlertTriangle
} from 'lucide-react';
import {
  AssignmentListItem,
  getPermissionsForAssignment,
  ActorContext
} from '../../../services/assignmentManagementService';
import {
  formatDateTimeVN,
  getAssignmentTypeLabel,
  getGradeStatusMeta,
  getReceiveStatusMeta
} from '../utils/formatters';

interface AssignmentListSidebarProps {
  actor: ActorContext;
  items: AssignmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedAssignmentId: string | null;
  onSelectAssignment: (id: string) => void;
  selectedAssignmentIds: string[];
  onToggleSelectAssignment: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onCreateAssignment: () => void;
  onAction: (
    action:
      | 'view_detail'
      | 'view_report'
      | 'edit_metadata'
      | 'duplicate'
      | 'reassign'
      | 'extend'
      | 'remind_unsubmitted'
      | 'close'
      | 'reopen'
      | 'withdraw'
      | 'export',
    item: AssignmentListItem
  ) => void;
}

export const AssignmentListSidebar: React.FC<AssignmentListSidebarProps> = ({
  actor,
  items,
  total,
  page,
  pageSize,
  onPageChange,
  selectedAssignmentId,
  onSelectAssignment,
  selectedAssignmentIds,
  onToggleSelectAssignment,
  isLoading,
  error,
  onRetry,
  hasActiveFilters,
  onResetFilters,
  onCreateAssignment,
  onAction
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (!openMenuId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openMenuId]);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Đang tải danh sách bài tập">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-[#031C2E] border border-[#064966] rounded-[12px] p-4 space-y-3 animate-pulse"
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-slate-700/60" />
              <div className="h-4 w-20 rounded bg-slate-700/60" />
            </div>
            <div className="h-5 w-4/5 rounded bg-slate-700/60" />
            <div className="h-2 w-full rounded bg-slate-700/60" />
            <div className="flex justify-between">
              <div className="h-3 w-28 rounded bg-slate-700/60" />
              <div className="h-3 w-20 rounded bg-slate-700/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-[#031C2E] border border-rose-500/40 rounded-[12px] p-5 text-center space-y-3"
      >
        <p className="text-sm font-semibold text-rose-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#031C2E] border border-[#064966] rounded-[12px] p-6 text-center space-y-3">
        <BookOpen className="w-8 h-8 text-[#009ED0] mx-auto opacity-80" aria-hidden="true" />
        {hasActiveFilters ? (
          <>
            <h3 className="text-sm font-semibold text-slate-100">Không có bài tập phù hợp bộ lọc</h3>
            <p className="text-xs text-slate-400">
              Từ khóa tìm kiếm hiện tại vẫn được giữ. Bạn có thể xóa bộ lọc để xem toàn bộ bài đã giao.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0088b5] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xóa bộ lọc</span>
            </button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-slate-100">Chưa có bài tập nào được giao</h3>
            <p className="text-xs text-slate-400">
              Tạo bài tập mới từ ngân hàng câu hỏi hoặc giao bài nhanh cho lớp bạn phụ trách.
            </p>
            {actor.role !== 'student' && actor.role !== 'parent' && (
              <button
                type="button"
                onClick={onCreateAssignment}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0088b5] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tạo bài tập mới</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5" aria-label="Danh sách bài tập đã giao">
      {items.map((item) => {
        const { assignment, stats } = item;
        const isSelected = selectedAssignmentId === assignment.id;
        const isChecked = selectedAssignmentIds.includes(assignment.id);
        const receiveMeta = getReceiveStatusMeta(stats.effectiveReceiveStatus, {
          isPastDue: stats.isPastDueNow,
          allowLate: assignment.allow_late
        });
        const gradeMeta = getGradeStatusMeta(stats.overallGradeStage);
        const perms = getPermissionsForAssignment(actor, assignment);

        const ratePct = stats.submissionRate ?? 0;

        return (
          <div
            key={assignment.id}
            className={`relative rounded-[12px] border p-3.5 transition-all duration-150 ${
              isSelected
                ? 'bg-[#052942] border-[#009ED0] ring-1 ring-[#009ED0]/40'
                : 'bg-[#031C2E] border-[#064966] hover:border-[#009ED0]/60 hover:bg-[#042338]'
            }`}
          >
            {/* Top row: Checkbox + Metadata + Menu ⋯ */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSelectAssignment(assignment.id)}
                  aria-label={`Chọn bài tập ${assignment.title}`}
                  className="mt-1 w-3.5 h-3.5 rounded border-[#064966] bg-[#00121F] accent-[#009ED0] cursor-pointer shrink-0"
                />

                <button
                  type="button"
                  onClick={() => onSelectAssignment(assignment.id)}
                  className="text-left min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-[#009ED0] rounded cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-300">
                    <span className="font-mono text-[#00D4FF]">{assignment.code || assignment.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-200">{assignment.class_name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{assignment.subject_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{getAssignmentTypeLabel(assignment.type)}</span>
                  </div>

                  <h3 className="text-[14px] font-semibold text-slate-50 leading-snug mt-1 line-clamp-2">
                    {assignment.title}
                  </h3>
                </button>
              </div>

              {/* Action menu trigger */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId((prev) => (prev === assignment.id ? null : assignment.id));
                  }}
                  aria-label={`Thao tác cho bài ${assignment.title}`}
                  aria-expanded={openMenuId === assignment.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#064966]/60 focus-visible:outline-2 focus-visible:outline-[#009ED0] cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {openMenuId === assignment.id && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setOpenMenuId(null)}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 mt-1 w-48 rounded-xl bg-[#042338] border border-[#064966] shadow-xl py-1.5 z-30 text-xs text-slate-200"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          onAction('view_detail', item);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#00D4FF]" />
                        <span>Xem chi tiết bài tập</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          onAction('view_report', item);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#00D4FF]" />
                        <span>Xem báo cáo thống kê</span>
                      </button>
                      {perms.canEditMetadata && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('edit_metadata', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                          <span>Chỉnh sửa thông tin</span>
                        </button>
                      )}
                      {perms.canRemind && stats.unsubmittedCount > 0 && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('remind_unsubmitted', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 text-amber-200 flex items-center gap-2 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-300" />
                          <span>Nhắc HS chưa nộp ({stats.unsubmittedCount})</span>
                        </button>
                      )}
                      {perms.canExtend && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('extend', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-amber-300" />
                          <span>Gia hạn toàn lớp</span>
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          onAction('duplicate', item);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Sao chép bản nháp</span>
                      </button>
                      {perms.canReassign && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('reassign', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Giao lại sang lớp khác</span>
                        </button>
                      )}
                      {perms.canClose && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('close', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 text-amber-300 flex items-center gap-2 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đóng nhận bài</span>
                        </button>
                      )}
                      {perms.canReopen && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            onAction('reopen', item);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 text-emerald-300 flex items-center gap-2 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở lại nhận bài</span>
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          onAction('export', item);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#064966]/60 flex items-center gap-2 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-300" />
                        <span>Xuất báo cáo bài này</span>
                      </button>
                      {perms.canWithdraw && (
                        <div className="border-t border-[#064966] mt-1 pt-1">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onAction('withdraw', item);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-rose-500/15 text-rose-300 flex items-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Thu hồi bài tập</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Clickable body metrics */}
            <button
              type="button"
              onClick={() => onSelectAssignment(assignment.id)}
              className="w-full text-left mt-3 space-y-2.5 cursor-pointer focus-visible:outline-hidden"
            >
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className={`inline-flex items-center gap-1 ${stats.isOverdueNow ? 'text-rose-300 font-medium' : 'text-slate-300'}`}>
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Hạn: {formatDateTimeVN(assignment.due_date)}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                  {stats.submissionRate !== null ? `${stats.submissionRate}%` : '—'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#00121F] overflow-hidden">
                <div
                  className="h-full bg-[#009ED0] transition-all duration-300"
                  style={{ width: `${ratePct}%` }}
                />
              </div>

              {/* Metrics row (submitted/total, graded/submitted) */}
              <div className="flex items-center justify-between text-[12px] text-slate-300 tabular-nums">
                <span>
                  Đã nộp:{' '}
                  <strong className="text-slate-100">
                    {stats.submittedCount}/{stats.totalStudents}
                  </strong>
                </span>
                <span>
                  Đã chấm:{' '}
                  <strong className="text-slate-100">
                    {stats.gradedCount}/{stats.submittedCount}
                  </strong>
                  {stats.pendingGradeCount > 0 && (
                    <span className="text-amber-300 ml-1">({stats.pendingGradeCount} chờ)</span>
                  )}
                </span>
              </div>

              {/* Independent dual lifecycle status row */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#064966]/50">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${receiveMeta.className}`}
                >
                  {receiveMeta.isPastDueOpen || stats.effectiveReceiveStatus === 'withdrawn' ? (
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  ) : stats.effectiveReceiveStatus === 'closed' ? (
                    <Lock className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  )}
                  <span>{receiveMeta.label}</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${gradeMeta.className}`}
                >
                  <span>{gradeMeta.label}</span>
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {/* Pagination Footer (UI-07: default 20/page) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#031C2E] border border-[#064966] rounded-[12px] text-xs text-slate-300">
        <span className="tabular-nums">
          Tổng <strong className="text-white">{total}</strong> bài · Trang{' '}
          <strong className="text-white">{page}</strong>/{totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Trang trước"
            className="p-1.5 rounded-lg border border-[#064966] bg-[#00121F] hover:border-[#009ED0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Trang sau"
            className="p-1.5 rounded-lg border border-[#064966] bg-[#00121F] hover:border-[#009ED0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
