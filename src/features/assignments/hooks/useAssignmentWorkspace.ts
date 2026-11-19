import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ActorContext,
  AssignmentComputedStats,
  AssignmentKpiSummary,
  AssignmentListItem,
  AssignmentManagementService,
  AssignmentPermissions,
  AssignmentQueryFilters,
  RecipientStudentRow,
  RecipientTab,
  RecipientTabCounts,
  ServiceError
} from '../../../services/assignmentManagementService';
import { DataService } from '../../../services/dataService';
import { Assignment, AssignmentEvent, ClassModel, GradeRevision, Subject } from '../../../types';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

const DEFAULT_PAGE_SIZE = 20;

export function useAssignmentWorkspace(routeAssignmentId?: string) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const actor: ActorContext = useMemo(
    () => ({
      userId: user?.id || 'user-teacher-1',
      role: user?.role || 'teacher',
      fullName: user?.full_name || 'Cô Trần Thị Mai',
      schoolId: user?.school_id || 'sch-001'
    }),
    [user]
  );

  // Authorized filter dropdown options
  const [authorizedClasses, setAuthorizedClasses] = useState<ClassModel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter state synced with URL query params
  const [searchInput, setSearchInput] = useState<string>(() => (searchParams.get('q') || '').slice(0, 100));
  const [debouncedSearch, setDebouncedSearch] = useState<string>(() => (searchParams.get('q') || '').slice(0, 100).trim());
  const [classIds, setClassIds] = useState<string[]>(() => {
    const raw = searchParams.get('class');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [subjectIds, setSubjectIds] = useState<string[]>(() => {
    const raw = searchParams.get('subject');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [typeFilter, setTypeFilter] = useState<AssignmentQueryFilters['type']>(
    () => (searchParams.get('type') as AssignmentQueryFilters['type']) || 'all'
  );
  const [receiveStatusFilter, setReceiveStatusFilter] = useState<AssignmentQueryFilters['receiveStatus']>(
    () => (searchParams.get('rstatus') as AssignmentQueryFilters['receiveStatus']) || 'all'
  );
  const [gradingFilter, setGradingFilter] = useState<AssignmentQueryFilters['gradingFilter']>(
    () => (searchParams.get('gstatus') as AssignmentQueryFilters['gradingFilter']) || 'all'
  );
  const [dateFrom, setDateFrom] = useState<string>(() => searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState<string>(() => searchParams.get('to') || '');
  const [sortMode, setSortMode] = useState<NonNullable<AssignmentQueryFilters['sort']>>(
    () => (searchParams.get('sort') as NonNullable<AssignmentQueryFilters['sort']>) || 'newest_assigned'
  );
  const [page, setPage] = useState<number>(() => Math.max(1, Number(searchParams.get('page') || 1)));

  // Selected assignment & student tab states
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    () => routeAssignmentId || searchParams.get('selected') || null
  );
  const [activeTab, setActiveTab] = useState<RecipientTab>(
    () => (searchParams.get('tab') as RecipientTab) || 'all'
  );
  const [onlyPendingGrade, setOnlyPendingGrade] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);

  // Fetched data state
  const [items, setItems] = useState<AssignmentListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [kpi, setKpi] = useState<AssignmentKpiSummary>({
    totalAssignments: 0,
    openAssignments: 0,
    overdueOrUnsubmittedCount: 0,
    pendingGradeTotal: 0
  });

  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);
  const [detailStats, setDetailStats] = useState<AssignmentComputedStats | null>(null);
  const [detailPermissions, setDetailPermissions] = useState<AssignmentPermissions | null>(null);
  const [detailEvents, setDetailEvents] = useState<AssignmentEvent[]>([]);
  const [detailRevisions, setDetailRevisions] = useState<GradeRevision[]>([]);
  const [publishableSubmissionIds, setPublishableSubmissionIds] = useState<string[]>([]);
  const [unsubmittedStudentIds, setUnsubmittedStudentIds] = useState<string[]>([]);
  const [recipientRows, setRecipientRows] = useState<RecipientStudentRow[]>([]);
  const [tabCounts, setTabCounts] = useState<RecipientTabCounts>({
    all: 0,
    submitted: 0,
    pendingGrade: 0,
    unsubmitted: 0,
    late: 0,
    graded: 0,
    published: 0
  });

  // Loading / Error / Conflict / Toast states
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    setToast({ id: Date.now(), type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Debounce keyword 300ms + trim + 100 char cap
  useEffect(() => {
    const trimmed = searchInput.slice(0, 100);
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep routeAssignmentId synced if navigated directly to /teacher/assignments/:id
  useEffect(() => {
    if (routeAssignmentId) {
      setSelectedAssignmentId(routeAssignmentId);
    }
  }, [routeAssignmentId]);

  // Sync filters and active context to URL query params (Section 5 & UI-07)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (classIds.length > 0) params.set('class', classIds.join(','));
    if (subjectIds.length > 0) params.set('subject', subjectIds.join(','));
    if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
    if (receiveStatusFilter && receiveStatusFilter !== 'all') params.set('rstatus', receiveStatusFilter);
    if (gradingFilter && gradingFilter !== 'all') params.set('gstatus', gradingFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (sortMode && sortMode !== 'newest_assigned') params.set('sort', sortMode);
    if (page > 1) params.set('page', String(page));
    if (selectedAssignmentId && !routeAssignmentId) params.set('selected', selectedAssignmentId);
    if (activeTab !== 'all') params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    classIds,
    subjectIds,
    typeFilter,
    receiveStatusFilter,
    gradingFilter,
    dateFrom,
    dateTo,
    sortMode,
    page,
    selectedAssignmentId,
    activeTab,
    routeAssignmentId,
    setSearchParams
  ]);

  const currentFilters: AssignmentQueryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      classIds,
      subjectIds,
      type: typeFilter,
      receiveStatus: receiveStatusFilter,
      gradingFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortMode,
      page,
      pageSize: DEFAULT_PAGE_SIZE
    }),
    [debouncedSearch, classIds, subjectIds, typeFilter, receiveStatusFilter, gradingFilter, dateFrom, dateTo, sortMode, page]
  );

  // Load authorized scope options
  useEffect(() => {
    AssignmentManagementService.getAuthorizedScopeData(actor)
      .then((res) => {
        setAuthorizedClasses(res.classes);
        setSubjects(res.subjects);
      })
      .catch(() => {
        setAuthorizedClasses([]);
        setSubjects([]);
      });
  }, [actor]);

  const fetchList = useCallback(async (withLoading = false) => {
    if (withLoading) setIsLoadingList(true);
    setListError(null);
    try {
      const res = await AssignmentManagementService.listAssignments(actor, currentFilters);
      setItems(res.items);
      setTotal(res.total);
      setKpi(res.kpi);

      // Select first item automatically if nothing selected and on desktop or when current selection disappeared
      setSelectedAssignmentId((prev) => {
        if (routeAssignmentId) return routeAssignmentId;
        if (prev && res.items.some((i) => i.assignment.id === prev)) return prev;
        if (typeof window !== 'undefined' && window.innerWidth >= 768 && res.items.length > 0) {
          return res.items[0].assignment.id;
        }
        return res.items.length > 0 ? prev : null;
      });
    } catch (err: any) {
      setListError(err?.message || 'Không thể tải danh sách bài tập đã giao.');
    } finally {
      setIsLoadingList(false);
    }
  }, [actor, currentFilters, routeAssignmentId]);

  const fetchDetail = useCallback(async (targetId: string | null, withLoading = false) => {
    if (!targetId) {
      setDetailAssignment(null);
      setDetailStats(null);
      setDetailPermissions(null);
      setDetailEvents([]);
      setDetailRevisions([]);
      setPublishableSubmissionIds([]);
      setUnsubmittedStudentIds([]);
      setRecipientRows([]);
      setTabCounts({ all: 0, submitted: 0, pendingGrade: 0, unsubmitted: 0, late: 0, graded: 0, published: 0 });
      return;
    }

    if (withLoading) setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const [detailRes, recRes] = await Promise.all([
        AssignmentManagementService.getAssignmentDetail(actor, targetId),
        AssignmentManagementService.getAssignmentRecipients(actor, targetId, {
          tab: activeTab,
          onlyPendingGrade: activeTab === 'submitted' ? onlyPendingGrade : false,
          search: studentSearch
        })
      ]);
      setDetailAssignment(detailRes.assignment);
      setDetailStats(detailRes.summary);
      setDetailPermissions(detailRes.permissions);
      setDetailEvents(detailRes.events);
      setDetailRevisions(detailRes.revisions);
      setPublishableSubmissionIds(detailRes.publishableSubmissionIds);
      setUnsubmittedStudentIds(detailRes.unsubmittedStudentIds);
      setRecipientRows(recRes.rows);
      setTabCounts(recRes.counts);
    } catch (err: any) {
      setDetailError(err?.message || 'Không thể tải chi tiết bài tập.');
      setDetailAssignment(null);
      setDetailRevisions([]);
      setPublishableSubmissionIds([]);
      setUnsubmittedStudentIds([]);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [actor, activeTab, onlyPendingGrade, studentSearch]);

  // Initial load & filter refetch
  useEffect(() => {
    fetchList(true);
  }, [fetchList]);

  // Fetch detail whenever selection or detail filters change
  useEffect(() => {
    fetchDetail(selectedAssignmentId, true);
  }, [selectedAssignmentId, fetchDetail]);

  // Clear student selection when switching assignments
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [selectedAssignmentId]);

  // Reactive store subscription (keeps selections intact per Section 15 "không mất selection")
  useEffect(() => {
    const unsub = DataService.subscribe(() => {
      fetchList(false);
      if (selectedAssignmentId) {
        fetchDetail(selectedAssignmentId, false);
      }
    });
    return unsub;
  }, [fetchList, fetchDetail, selectedAssignmentId]);

  const refreshAll = useCallback(async () => {
    setConflictBanner(null);
    await fetchList(true);
    if (selectedAssignmentId) {
      await fetchDetail(selectedAssignmentId, true);
    }
    showToast('info', 'Đã đồng bộ dữ liệu mới nhất từ hệ thống.');
  }, [fetchList, fetchDetail, selectedAssignmentId, showToast]);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setClassIds([]);
    setSubjectIds([]);
    setTypeFilter('all');
    setReceiveStatusFilter('all');
    setGradingFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortMode('newest_assigned');
    setPage(1);
    setSelectedAssignmentIds([]);
  }, []);

  const handleServiceError = useCallback(
    (err: unknown) => {
      if (err instanceof ServiceError && err.status === 409) {
        setConflictBanner(err.message);
        showToast('warning', 'Phát hiện xung đột phiên bản dữ liệu (409). Vui lòng tải mới.');
        return;
      }
      const message = err instanceof Error ? err.message : 'Thao tác không thành công. Vui lòng thử lại.';
      showToast('error', message);
    },
    [showToast]
  );

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      classIds.length > 0 ||
      subjectIds.length > 0 ||
      (typeFilter && typeFilter !== 'all') ||
      (receiveStatusFilter && receiveStatusFilter !== 'all') ||
      (gradingFilter && gradingFilter !== 'all') ||
      dateFrom ||
      dateTo ||
      sortMode !== 'newest_assigned'
  );

  return {
    actor,
    authorizedClasses,
    subjects,
    // Filters & Pagination
    searchInput,
    setSearchInput,
    debouncedSearch,
    classIds,
    setClassIds,
    subjectIds,
    setSubjectIds,
    typeFilter,
    setTypeFilter,
    receiveStatusFilter,
    setReceiveStatusFilter,
    gradingFilter,
    setGradingFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortMode,
    setSortMode,
    page,
    setPage,
    pageSize: DEFAULT_PAGE_SIZE,
    hasActiveFilters,
    currentFilters,
    resetFilters,
    // List data
    items,
    total,
    kpi,
    selectedAssignmentId,
    setSelectedAssignmentId,
    selectedAssignmentIds,
    setSelectedAssignmentIds,
    // Detail data
    detailAssignment,
    detailStats,
    detailPermissions,
    detailEvents,
    detailRevisions,
    publishableSubmissionIds,
    unsubmittedStudentIds,
    recipientRows,
    tabCounts,
    activeTab,
    setActiveTab,
    onlyPendingGrade,
    setOnlyPendingGrade,
    studentSearch,
    setStudentSearch,
    selectedStudentIds,
    setSelectedStudentIds,
    // Status & feedback
    isLoadingList,
    isLoadingDetail,
    listError,
    detailError,
    conflictBanner,
    setConflictBanner,
    toast,
    setToast,
    showToast,
    handleServiceError,
    refreshAll,
    fetchList,
    fetchDetail
  };
}
