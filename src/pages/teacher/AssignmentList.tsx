import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';
import { AssignmentFilters } from '../../features/assignments/components/AssignmentFilters';
import { AssignmentKpiBar } from '../../features/assignments/components/AssignmentKpiBar';
import { AssignmentListSidebar } from '../../features/assignments/components/AssignmentListSidebar';
import { AssignmentDetailPanel } from '../../features/assignments/components/AssignmentDetailPanel';
import { AssignmentReportView } from '../../features/assignments/components/AssignmentReportView';
import {
  CloseReopenModal,
  DirectSubmissionModal,
  DuplicateReassignModal,
  EditMetadataModal,
  ExportReportModal,
  ExtendDeadlineModal,
  GradingWorkspaceModal,
  PublishGradesModal,
  RemindModal,
  RequestResubmitModal,
  ReviseGradeModal,
  WithdrawModal
} from '../../features/assignments/components/AssignmentModals';
import { useAssignmentWorkspace } from '../../features/assignments/hooks/useAssignmentWorkspace';
import { AssignmentListItem, AssignmentManagementService } from '../../services/assignmentManagementService';
import { store } from '../../services/dataService';
import { Student, Submission } from '../../types';

interface AssignmentListProps {
  routeAssignmentId?: string;
  routeSubmissionId?: string;
  viewMode?: 'workspace' | 'report';
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  routeAssignmentId,
  routeSubmissionId,
  viewMode = 'workspace'
}) => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string; sid?: string }>();
  const effectiveRouteAssignmentId = routeAssignmentId || params.id;
  const effectiveRouteSubmissionId = routeSubmissionId || params.sid;

  const ws = useAssignmentWorkspace(effectiveRouteAssignmentId);

  // Mobile toggle between list and detail view (< 768px)
  const [mobileShowDetail, setMobileShowDetail] = useState<boolean>(Boolean(effectiveRouteAssignmentId));

  // Modal state holders (store ID so modals always read fresh live Assignment + version)
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(null);
  const [extendModal, setExtendModal] = useState<{ open: boolean; studentIds?: string[]; studentNames?: string[] }>({
    open: false
  });
  const [remindModal, setRemindModal] = useState<{ open: boolean; studentIds: string[]; studentNames: string[] }>({
    open: false,
    studentIds: [],
    studentNames: []
  });
  const [reviseModal, setReviseModal] = useState<{ open: boolean; submission: Submission | null }>({
    open: false,
    submission: null
  });
  const [publishModal, setPublishModal] = useState<{ open: boolean; submissionIds: string[] }>({
    open: false,
    submissionIds: []
  });
  const [closeReopenModal, setCloseReopenModal] = useState<{ open: boolean; mode: 'close' | 'reopen' }>({
    open: false,
    mode: 'close'
  });
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [dupModal, setDupModal] = useState<{ open: boolean; mode: 'copy' | 'reassign' }>({
    open: false,
    mode: 'copy'
  });
  const [resubmitModal, setResubmitModal] = useState<{
    open: boolean;
    studentIds: string[];
    studentNames: string[];
  }>({
    open: false,
    studentIds: [],
    studentNames: []
  });
  const [directRecordModal, setDirectRecordModal] = useState<{
    open: boolean;
    student: Student | null;
  }>({
    open: false,
    student: null
  });
  const [exportModal, setExportModal] = useState<{
    open: boolean;
    assignmentId?: string | null;
    defaultScope?: 'current_assignment_students' | 'filtered_assignments' | 'selected_assignments';
  }>({ open: false });
  const [editMetadataModalOpen, setEditMetadataModalOpen] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(
    effectiveRouteSubmissionId || null
  );

  // Sync deep link submission ID
  useEffect(() => {
    if (effectiveRouteSubmissionId) {
      setGradingSubmissionId(effectiveRouteSubmissionId);
      setMobileShowDetail(true);
    }
  }, [effectiveRouteSubmissionId]);

  useEffect(() => {
    if (effectiveRouteAssignmentId) {
      setMobileShowDetail(true);
    }
  }, [effectiveRouteAssignmentId]);

  const resolveStudentNames = (ids: string[]): string[] =>
    ids.map((id) => {
      const row = ws.recipientRows.find((r) => r.student.id === id);
      if (row) return row.student.full_name;
      const stu = store.students.find((s) => s.id === id);
      return stu?.full_name || id;
    });

  const handleApplyKpiFilter = (preset: 'all' | 'open' | 'overdue' | 'pending_grade') => {
    ws.setPage(1);
    if (preset === 'all') {
      ws.setReceiveStatusFilter('all');
      ws.setGradingFilter('all');
    } else if (preset === 'open') {
      ws.setReceiveStatusFilter('open');
      ws.setGradingFilter('all');
    } else if (preset === 'overdue') {
      ws.setReceiveStatusFilter('overdue_unsubmitted');
      ws.setGradingFilter('all');
    } else if (preset === 'pending_grade') {
      ws.setReceiveStatusFilter('all');
      ws.setGradingFilter('pending_grade');
    }
  };

  const handleSelectAssignmentCard = (id: string) => {
    ws.setSelectedAssignmentId(id);
    setMobileShowDetail(true);
  };

  const handleSidebarCardAction = async (
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
  ) => {
    const targetAsg = item.assignment;
    ws.setSelectedAssignmentId(targetAsg.id);
    setModalAssignmentId(targetAsg.id);

    if (action === 'view_detail') {
      setMobileShowDetail(true);
      return;
    }
    if (action === 'view_report') {
      navigate(`/teacher/assignments/${targetAsg.id}/reports`);
      return;
    }
    if (action === 'remind_unsubmitted') {
      try {
        const detail = await AssignmentManagementService.getAssignmentDetail(ws.actor, targetAsg.id);
        if (detail.unsubmittedStudentIds.length === 0) {
          ws.showToast('info', 'Tất cả học sinh của bài tập này đã nộp bài.');
          return;
        }
        setRemindModal({
          open: true,
          studentIds: detail.unsubmittedStudentIds,
          studentNames: resolveStudentNames(detail.unsubmittedStudentIds)
        });
      } catch (err) {
        ws.handleServiceError(err);
      }
      return;
    }
    if (action === 'edit_metadata') {
      setEditMetadataModalOpen(true);
      return;
    }
    if (action === 'duplicate') {
      setDupModal({ open: true, mode: 'copy' });
      return;
    }
    if (action === 'reassign') {
      setDupModal({ open: true, mode: 'reassign' });
      return;
    }
    if (action === 'extend') {
      setExtendModal({ open: true });
      return;
    }
    if (action === 'close') {
      setCloseReopenModal({ open: true, mode: 'close' });
      return;
    }
    if (action === 'reopen') {
      setCloseReopenModal({ open: true, mode: 'reopen' });
      return;
    }
    if (action === 'withdraw') {
      setWithdrawModalOpen(true);
      return;
    }
    if (action === 'export') {
      setExportModal({
        open: true,
        assignmentId: targetAsg.id,
        defaultScope: 'current_assignment_students'
      });
    }
  };

  // Always resolve the freshest Assignment object (latest version)
  const activeAsg =
    (modalAssignmentId && ws.detailAssignment?.id === modalAssignmentId
      ? ws.detailAssignment
      : modalAssignmentId
      ? ws.items.find((i) => i.assignment.id === modalAssignmentId)?.assignment
      : null) || ws.detailAssignment;

  const renderToast = () => {
    if (!ws.toast) return null;
    const isError = ws.toast.type === 'error';
    const isWarn = ws.toast.type === 'warning';
    return (
      <div
        role="status"
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium max-w-md ${
          isError
            ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200'
            : isWarn
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200'
            : 'border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
        }`}
      >
        {isError || isWarn ? (
          <AlertTriangle className={`w-4 h-4 shrink-0 ${isError ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        )}
        <span>{ws.toast.text}</span>
        <button
          type="button"
          onClick={() => ws.setToast(null)}
          aria-label="Đóng thông báo"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Report sub-route view: /teacher/assignments/:id/reports
  if (viewMode === 'report') {
    if (ws.isLoadingDetail && !ws.detailAssignment) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-[14px] p-8 space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      );
    }

    if (ws.detailError || !ws.detailAssignment || !ws.detailStats) {
      return (
        <div
          role="alert"
          className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 shadow-xs rounded-[14px] p-8 text-center space-y-3"
        >
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Không thể tải báo cáo bài tập</h2>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {ws.detailError || 'Bài tập không tồn tại hoặc bạn không có quyền xem dữ liệu của lớp này.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/teacher/assignments')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về danh sách bài tập</span>
            </button>
            <button
              type="button"
              onClick={() => ws.fetchDetail(ws.selectedAssignmentId, true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderToast()}

        <AssignmentReportView
          assignment={ws.detailAssignment}
          stats={ws.detailStats}
          rows={ws.recipientRows}
          events={ws.detailEvents}
          revisions={ws.detailRevisions}
          onBack={() => navigate(`/teacher/assignments/${ws.detailAssignment!.id}`)}
          onExport={() =>
            setExportModal({
              open: true,
              assignmentId: ws.detailAssignment!.id,
              defaultScope: 'current_assignment_students'
            })
          }
        />

        <ExportReportModal
          isOpen={exportModal.open}
          onClose={() => setExportModal({ open: false })}
          actor={ws.actor}
          currentAssignmentId={exportModal.assignmentId ?? ws.selectedAssignmentId}
          selectedAssignmentIds={ws.selectedAssignmentIds}
          filters={ws.currentFilters}
          defaultScope={exportModal.defaultScope}
          onSuccess={(msg) => ws.showToast('success', msg)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {renderToast()}

      {/* UI-02: Page Header & Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Danh sách bài tập đã giao
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold tabular-nums">
              {ws.total} bài tập
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ nộp bài theo từng lớp, nhắc nộp, gia hạn cá nhân/cả lớp, chấm điểm và trả bài kiểm soát theo quy chế.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/teacher/assignments/topics"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Quản lý chủ đề</span>
          </Link>

          <Link
            to="/teacher/assignments/create-from-bank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo bài tập mới</span>
          </Link>

          <Link
            to="/teacher/assignments/create-quick"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Giao nhanh</span>
          </Link>

          <button
            type="button"
            onClick={() =>
              setExportModal({
                open: true,
                assignmentId: ws.selectedAssignmentId,
                defaultScope: ws.selectedAssignmentIds.length > 0 ? 'selected_assignments' : 'filtered_assignments'
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </header>

      {/* 409 Optimistic Concurrency Conflict Banner */}
      {ws.conflictBanner && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{ws.conflictBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => ws.refreshAll()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải lại dữ liệu</span>
          </button>
        </div>
      )}

      {/* UI-03: 4 Interactive KPI Summary Cards */}
      <AssignmentKpiBar
        kpi={ws.kpi}
        receiveStatusFilter={ws.receiveStatusFilter}
        gradingFilter={ws.gradingFilter}
        onApplyKpiFilter={handleApplyKpiFilter}
        isLoading={ws.isLoadingList}
      />

      {/* UI-04: Filter, Search & Sort Bar */}
      <AssignmentFilters
        searchInput={ws.searchInput}
        onSearchChange={ws.setSearchInput}
        classIds={ws.classIds}
        onClassIdsChange={(ids) => {
          ws.setClassIds(ids);
          ws.setPage(1);
        }}
        subjectIds={ws.subjectIds}
        onSubjectIdsChange={(ids) => {
          ws.setSubjectIds(ids);
          ws.setPage(1);
        }}
        typeFilter={ws.typeFilter}
        onTypeFilterChange={(val) => {
          ws.setTypeFilter(val);
          ws.setPage(1);
        }}
        receiveStatusFilter={ws.receiveStatusFilter}
        onReceiveStatusChange={(val) => {
          ws.setReceiveStatusFilter(val);
          ws.setPage(1);
        }}
        gradingFilter={ws.gradingFilter}
        onGradingFilterChange={(val) => {
          ws.setGradingFilter(val);
          ws.setPage(1);
        }}
        dateFrom={ws.dateFrom}
        dateTo={ws.dateTo}
        onDateRangeChange={(from, to) => {
          ws.setDateFrom(from);
          ws.setDateTo(to);
          ws.setPage(1);
        }}
        sortMode={ws.sortMode}
        onSortChange={(val) => {
          ws.setSortMode(val);
          ws.setPage(1);
        }}
        authorizedClasses={ws.authorizedClasses}
        subjects={ws.subjects}
        hasActiveFilters={ws.hasActiveFilters}
        onResetFilters={ws.resetFilters}
        onRefresh={ws.refreshAll}
      />

      {/* Batch Assignment Selection Bar (ACT-19) */}
      {ws.selectedAssignmentIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs">
          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100 font-semibold">
            <span>Đã chọn {ws.selectedAssignmentIds.length} bài tập trong danh sách</span>
            <button
              type="button"
              onClick={() => ws.setSelectedAssignmentIds([])}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-normal cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setExportModal({
                  open: true,
                  defaultScope: 'selected_assignments'
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Xuất danh sách đã chọn ({ws.selectedAssignmentIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive Split-View Workspace:
          - Mobile (<768px): 1 column switching between list and detail
          - Tablet (768–1199px): 38% Left / 62% Right
          - Desktop (>=1200px): 32% Left / 68% Right */}
      <div className="grid grid-cols-1 md:grid-cols-[38%_minmax(0,1fr)] xl:grid-cols-[32%_minmax(0,1fr)] gap-4 items-start">
        <div className={`${mobileShowDetail ? 'hidden md:block' : 'block'}`}>
          <AssignmentListSidebar
            actor={ws.actor}
            items={ws.items}
            total={ws.total}
            page={ws.page}
            pageSize={ws.pageSize}
            onPageChange={ws.setPage}
            selectedAssignmentId={ws.selectedAssignmentId}
            onSelectAssignment={handleSelectAssignmentCard}
            selectedAssignmentIds={ws.selectedAssignmentIds}
            onToggleSelectAssignment={(id) =>
              ws.setSelectedAssignmentIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              )
            }
            isLoading={ws.isLoadingList}
            error={ws.listError}
            onRetry={() => ws.fetchList(true)}
            hasActiveFilters={ws.hasActiveFilters}
            onResetFilters={ws.resetFilters}
            onCreateAssignment={() => navigate('/teacher/assignments/create-from-bank')}
            onAction={handleSidebarCardAction}
          />
        </div>

        <div className={`${mobileShowDetail ? 'block' : 'hidden md:block'} min-w-0`}>
          <AssignmentDetailPanel
            assignment={ws.detailAssignment}
            stats={ws.detailStats}
            permissions={ws.detailPermissions}
            events={ws.detailEvents}
            revisions={ws.detailRevisions}
            publishableSubmissionIds={ws.publishableSubmissionIds}
            unsubmittedStudentIds={ws.unsubmittedStudentIds}
            recipientRows={ws.recipientRows}
            tabCounts={ws.tabCounts}
            activeTab={ws.activeTab}
            onTabChange={(tab) => {
              ws.setActiveTab(tab);
              ws.setSelectedStudentIds([]);
            }}
            onlyPendingGrade={ws.onlyPendingGrade}
            onOnlyPendingGradeChange={ws.setOnlyPendingGrade}
            studentSearch={ws.studentSearch}
            onStudentSearchChange={ws.setStudentSearch}
            selectedStudentIds={ws.selectedStudentIds}
            onToggleStudent={(studentId) =>
              ws.setSelectedStudentIds((prev) =>
                prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
              )
            }
            onSelectAllVisibleStudents={() => {
              const allVisible =
                ws.recipientRows.length > 0 &&
                ws.recipientRows.every((r) => ws.selectedStudentIds.includes(r.student.id));
              if (allVisible) {
                ws.setSelectedStudentIds([]);
              } else {
                ws.setSelectedStudentIds(ws.recipientRows.map((r) => r.student.id));
              }
            }}
            onClearStudentSelection={() => ws.setSelectedStudentIds([])}
            isLoading={ws.isLoadingDetail}
            error={ws.detailError}
            onRetry={() => ws.fetchDetail(ws.selectedAssignmentId, true)}
            onBackMobile={() => setMobileShowDetail(false)}
            onOpenReport={(assignmentId) => navigate(`/teacher/assignments/${assignmentId}/reports`)}
            onOpenEditMetadata={() => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setEditMetadataModalOpen(true);
            }}
            onOpenExtend={(studentIds) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setExtendModal({
                open: true,
                studentIds,
                studentNames: studentIds ? resolveStudentNames(studentIds) : undefined
              });
            }}
            onOpenCloseOrReopen={(mode) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setCloseReopenModal({ open: true, mode });
            }}
            onOpenWithdraw={() => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setWithdrawModalOpen(true);
            }}
            onOpenDuplicateOrReassign={(mode) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setDupModal({ open: true, mode });
            }}
            onOpenRemind={(studentIds) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setRemindModal({
                open: true,
                studentIds,
                studentNames: resolveStudentNames(studentIds)
              });
            }}
            onOpenPublish={(submissionIds) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setPublishModal({ open: true, submissionIds });
            }}
            onOpenRequestResubmit={(studentIds) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setResubmitModal({
                open: true,
                studentIds,
                studentNames: resolveStudentNames(studentIds)
              });
            }}
            onOpenDirectRecord={(student) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setDirectRecordModal({ open: true, student });
            }}
            onOpenExport={() => {
              if (!ws.detailAssignment) return;
              setExportModal({
                open: true,
                assignmentId: ws.detailAssignment.id,
                defaultScope: 'current_assignment_students'
              });
            }}
            onOpenGradingWorkspace={(submission) => {
              setGradingSubmissionId(submission.id);
            }}
            onOpenReviseGrade={(submission) => {
              if (!ws.detailAssignment) return;
              setModalAssignmentId(ws.detailAssignment.id);
              setReviseModal({ open: true, submission });
            }}
          />
        </div>
      </div>

      {/* ALL MODALS (MOD-01 .. MOD-09 + EDIT METADATA + GRADING WORKSPACE + DIRECT RECORD) */}
      {activeAsg && (
        <>
          <ExtendDeadlineModal
            isOpen={extendModal.open}
            onClose={() => setExtendModal({ open: false })}
            actor={ws.actor}
            assignment={activeAsg}
            recipientIds={extendModal.studentIds}
            recipientNames={extendModal.studentNames}
            onSuccess={(msg) => ws.showToast('success', msg)}
            onError={ws.handleServiceError}
          />

          <RemindModal
            isOpen={remindModal.open}
            onClose={() => setRemindModal({ open: false, studentIds: [], studentNames: [] })}
            actor={ws.actor}
            assignment={activeAsg}
            recipientIds={remindModal.studentIds}
            recipientNames={remindModal.studentNames}
            onSuccess={(msg) => ws.showToast('success', msg)}
            onError={ws.handleServiceError}
          />

          {reviseModal.submission && (
            <ReviseGradeModal
              isOpen={reviseModal.open}
              onClose={() => setReviseModal({ open: false, submission: null })}
              actor={ws.actor}
              assignment={activeAsg}
              submission={reviseModal.submission}
              onSuccess={(msg) => ws.showToast('success', msg)}
              onError={ws.handleServiceError}
            />
          )}

          <PublishGradesModal
            isOpen={publishModal.open}
            onClose={() => setPublishModal({ open: false, submissionIds: [] })}
            actor={ws.actor}
            assignment={activeAsg}
            submissionIds={publishModal.submissionIds}
            onSuccess={(msg) => {
              ws.setSelectedStudentIds([]);
              ws.showToast('success', msg);
            }}
            onError={ws.handleServiceError}
          />

          <CloseReopenModal
            isOpen={closeReopenModal.open}
            onClose={() => setCloseReopenModal({ open: false, mode: 'close' })}
            mode={closeReopenModal.mode}
            actor={ws.actor}
            assignment={activeAsg}
            onSuccess={(msg) => ws.showToast('success', msg)}
            onError={ws.handleServiceError}
          />

          <WithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            actor={ws.actor}
            assignment={activeAsg}
            onSuccess={(msg) => {
              ws.showToast('success', msg);
              setMobileShowDetail(false);
            }}
            onError={ws.handleServiceError}
          />

          <DuplicateReassignModal
            isOpen={dupModal.open}
            onClose={() => setDupModal({ open: false, mode: 'copy' })}
            mode={dupModal.mode}
            actor={ws.actor}
            assignment={activeAsg}
            authorizedClasses={ws.authorizedClasses}
            onSuccess={(msg, createdIds) => {
              ws.showToast('success', msg);
              if (ws.receiveStatusFilter !== 'all') {
                ws.setReceiveStatusFilter('all');
              }
              if (createdIds.length > 0) {
                ws.setSelectedAssignmentId(createdIds[0]);
              }
            }}
            onError={ws.handleServiceError}
          />

          <RequestResubmitModal
            isOpen={resubmitModal.open}
            onClose={() => setResubmitModal({ open: false, studentIds: [], studentNames: [] })}
            actor={ws.actor}
            assignment={activeAsg}
            studentIds={resubmitModal.studentIds}
            studentNames={resubmitModal.studentNames}
            onSuccess={(msg) => {
              ws.setSelectedStudentIds([]);
              ws.showToast('success', msg);
            }}
            onError={ws.handleServiceError}
          />

          <EditMetadataModal
            isOpen={editMetadataModalOpen}
            onClose={() => setEditMetadataModalOpen(false)}
            actor={ws.actor}
            assignment={activeAsg}
            hasSubmissions={
              (ws.detailAssignment?.id === activeAsg.id
                ? ws.detailStats?.submittedCount || 0
                : activeAsg.submitted_count) > 0
            }
            onSuccess={(msg) => ws.showToast('success', msg)}
            onError={ws.handleServiceError}
          />

          <DirectSubmissionModal
            isOpen={directRecordModal.open}
            onClose={() => setDirectRecordModal({ open: false, student: null })}
            actor={ws.actor}
            assignment={activeAsg}
            student={directRecordModal.student}
            onSuccess={(msg) => {
              ws.setSelectedStudentIds([]);
              ws.showToast('success', msg);
            }}
            onError={ws.handleServiceError}
          />
        </>
      )}

      <ExportReportModal
        isOpen={exportModal.open}
        onClose={() => setExportModal({ open: false })}
        actor={ws.actor}
        currentAssignmentId={exportModal.assignmentId ?? ws.selectedAssignmentId}
        selectedAssignmentIds={ws.selectedAssignmentIds}
        filters={ws.currentFilters}
        defaultScope={exportModal.defaultScope}
        onSuccess={(msg) => ws.showToast('success', msg)}
      />

      <GradingWorkspaceModal
        isOpen={Boolean(gradingSubmissionId)}
        onClose={() => setGradingSubmissionId(null)}
        actor={ws.actor}
        submissionId={gradingSubmissionId}
        onSuccess={(msg) => ws.showToast('success', msg)}
        onError={ws.handleServiceError}
        onOpenReviseModal={(sub) => {
          if (ws.detailAssignment) setModalAssignmentId(ws.detailAssignment.id);
          setReviseModal({ open: true, submission: sub });
        }}
      />
    </div>
  );
};
