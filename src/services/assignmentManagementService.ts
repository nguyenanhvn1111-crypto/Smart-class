import {
  Assignment,
  AssignmentEvent,
  AssignmentEventType,
  AssignmentReceiveStatus,
  AssignmentRecipient,
  ClassModel,
  GradeRevision,
  GradeStatus,
  NotificationChannel,
  NotificationDelivery,
  NotificationJob,
  Student,
  Subject,
  Submission,
  UserRole
} from '../types';
import { store } from './dataService';

export class ServiceError extends Error {
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;
  code: string;
  details?: any;

  constructor(
    status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ActorContext {
  userId: string;
  role: UserRole;
  fullName: string;
  schoolId?: string;
}

// Section 18: Default prototype business policies (clearly documented for production confirmation)
export const BUSINESS_POLICY_DEFAULTS = {
  allowLateSubmissionDefault: true,
  latePenaltyPercentDefault: 0, // Gắn nhãn nộp muộn; không tự trừ điểm trừ khi bài đặt late_penalty_percent > 0
  resubmitGradingPolicyDefault: 'latest_valid' as const, // Mặc định tính lần nộp cuối hợp lệ
  publishedGradeEditRoles: ['teacher', 'admin'] as UserRole[], // Cần lý do bắt buộc & lưu GradeRevision
  withdrawWithGradesPolicy: 'soft_withdraw_teacher_and_admin' as const, // Giáo viên chủ nhiệm bài hoặc Admin được thu hồi mềm, giữ 100% lịch sử & điểm
  autoParentNotifyThresholdDays: 2, // Ngưỡng mặc định nhắc qua Hệ thống + App phụ huynh
  reminderCooldownMinutes: 60, // Chống gửi nhắc trùng trong 60 phút
  maxAttachmentSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedAttachmentMimes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ],
  maxExportRows: 5000,
  schoolTimezone: 'Asia/Ho_Chi_Minh'
};

export interface AssignmentComputedStats {
  totalStudents: number;
  submittedCount: number;
  unsubmittedCount: number;
  lateCount: number;
  gradedCount: number;
  publishedCount: number;
  pendingGradeCount: number;
  draftGradeCount: number;
  submissionRate: number | null; // null renders as '—' when totalStudents = 0
  gradingProgress: number | null;
  averageScore: number | null;
  isPastDueNow: boolean;
  isOverdueNow: boolean;
  effectiveReceiveStatus: AssignmentReceiveStatus;
  overallGradeStage: GradeStatus;
}

export interface AssignmentListItem {
  assignment: Assignment;
  stats: AssignmentComputedStats;
}

export interface AssignmentKpiSummary {
  totalAssignments: number;
  openAssignments: number;
  overdueOrUnsubmittedCount: number;
  pendingGradeTotal: number;
}

export interface AssignmentQueryFilters {
  search?: string;
  classIds?: string[];
  subjectIds?: string[];
  type?: 'all' | 'homework' | 'exam' | 'classwork';
  receiveStatus?: 'all' | AssignmentReceiveStatus | 'overdue_unsubmitted';
  gradingFilter?: 'all' | 'pending_grade' | 'partially_graded' | 'fully_graded' | 'published';
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest_assigned' | 'nearest_due' | 'lowest_submission_rate' | 'highest_pending_grade';
  page?: number;
  pageSize?: number;
}

export type RecipientTab = 'all' | 'submitted' | 'unsubmitted' | 'late' | 'graded';

export interface RecipientStudentRow {
  student: Student;
  recipientRecord?: AssignmentRecipient;
  officialSubmission: Submission | null;
  allAttempts: Submission[];
  attemptCount: number;
  effectiveDueAt: string;
  hasPersonalExtension: boolean;
  isSubmitted: boolean;
  isLate: boolean;
  delayMinutes: number;
  gradeStatus: GradeStatus;
  effectiveScore: number | null;
  reminderCount: number;
  lastRemindedAt: string | null;
  canExtend: boolean;
  canRemind: boolean;
  canGrade: boolean;
  canRevise: boolean;
  canPublish: boolean;
  canRequestResubmit: boolean;
}

export interface RecipientTabCounts {
  all: number;
  submitted: number;
  pendingGrade: number;
  unsubmitted: number;
  late: number;
  graded: number;
  published: number;
}

export interface AssignmentPermissions {
  canEditMetadata: boolean;
  canExtend: boolean;
  canClose: boolean;
  canReopen: boolean;
  canWithdraw: boolean;
  canDuplicate: boolean;
  canReassign: boolean;
  canRemind: boolean;
  canGrade: boolean;
  canReviseGrade: boolean;
  canPublish: boolean;
  canRequestResubmit: boolean;
  canExport: boolean;
}

function assertAuthenticated(actor: ActorContext | null | undefined): asserts actor is ActorContext {
  if (!actor || !actor.userId) {
    throw new ServiceError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
}

export function getAuthorizedClassIds(actor: ActorContext): string[] {
  if (actor.role === 'admin') {
    return store.classes.map((c) => c.id);
  }
  if (actor.role !== 'teacher') {
    return [];
  }
  const now = Date.now();
  const fromTca = store.teacherClassAssignments
    .filter((tca) => {
      if (tca.teacher_id !== actor.userId) return false;
      const fromOk = new Date(tca.valid_from).getTime() <= now;
      const toOk = !tca.valid_to || new Date(tca.valid_to).getTime() >= now;
      return fromOk && toOk;
    })
    .map((tca) => tca.class_id);

  const fromHomeroom = store.classes
    .filter((c) => c.homeroom_teacher_id === actor.userId)
    .map((c) => c.id);

  return Array.from(new Set([...fromTca, ...fromHomeroom]));
}

export function canTeacherManageAssignment(actor: ActorContext, assignment: Assignment): boolean {
  if (actor.role === 'admin') return true;
  if (actor.role !== 'teacher') return false;
  if (assignment.teacher_id === actor.userId) return true;
  const authorizedClasses = getAuthorizedClassIds(actor);
  return authorizedClasses.includes(assignment.class_id);
}

function assertCanAccessAssignment(actor: ActorContext, assignment: Assignment | undefined): asserts assignment is Assignment {
  assertAuthenticated(actor);
  if (!assignment) {
    throw new ServiceError(404, 'ASSIGNMENT_NOT_FOUND', 'Không tìm thấy bài tập đã giao.');
  }
  if (actor.role === 'student' || actor.role === 'parent') {
    throw new ServiceError(403, 'FORBIDDEN', 'Vai trò hiện tại không có quyền quản trị bài tập của giáo viên.');
  }
  if (!canTeacherManageAssignment(actor, assignment)) {
    throw new ServiceError(
      403,
      'FORBIDDEN_CLASS_SCOPE',
      'Bạn không có quyền xem hoặc thao tác trên bài tập của lớp không được phân công.'
    );
  }
}

function resolveSnapshotStudents(assignment: Assignment): Student[] {
  const recipientRecords = store.assignmentRecipients.filter((r) => r.assignment_id === assignment.id);
  const classStudents = store.students.filter((s) => s.class_id === assignment.class_id);
  const byId = new Map<string, Student>();

  classStudents.forEach((s) => byId.set(s.id, s));

  // Ensure any explicit recipient record or submission student belongs in snapshot
  recipientRecords.forEach((rec) => {
    const found = store.students.find((s) => s.id === rec.student_id);
    if (found) byId.set(found.id, found);
  });

  store.submissions
    .filter((s) => s.assignment_id === assignment.id)
    .forEach((sub) => {
      if (!byId.has(sub.student_id)) {
        const found = store.students.find((s) => s.id === sub.student_id);
        if (found) {
          byId.set(found.id, found);
        } else {
          byId.set(sub.student_id, {
            id: sub.student_id,
            profile_id: sub.student_id,
            student_code: sub.student_code,
            full_name: sub.student_name,
            email: '',
            status: 'active',
            class_id: assignment.class_id,
            class_name: assignment.class_name
          });
        }
      }
    });

  return Array.from(byId.values()).sort((a, b) => (a.roll_number || 999) - (b.roll_number || 999));
}

export function selectOfficialSubmission(attempts: Submission[], assignment: Assignment): Submission | null {
  if (!attempts || attempts.length === 0) return null;
  const policy = assignment.grading_policy || 'latest_valid';

  if (policy === 'teacher_selected') {
    const explicit = attempts.find((a) => a.is_official);
    if (explicit) return explicit;
  }

  if (policy === 'highest_score') {
    const scored = attempts.filter((a) => a.score !== undefined && a.score !== null);
    if (scored.length > 0) {
      return [...scored].sort((a, b) => {
        const diff = (b.score ?? -1) - (a.score ?? -1);
        if (diff !== 0) return diff;
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      })[0];
    }
  }

  // latest_valid (default)
  return [...attempts].sort((a, b) => {
    const attDiff = (b.attempt_no || 1) - (a.attempt_no || 1);
    if (attDiff !== 0) return attDiff;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  })[0];
}

export function deriveSubmissionGradeStatus(sub: Submission | null): GradeStatus {
  if (!sub) return 'ungraded';
  if (sub.grade_status) return sub.grade_status;
  if (sub.published_at) return 'published';
  if (sub.status === 'graded' || (sub.score !== undefined && sub.score !== null)) return 'graded';
  return 'ungraded';
}

export function deriveAssignmentReceiveStatus(assignment: Assignment): AssignmentReceiveStatus {
  if (assignment.withdrawn_at || assignment.receive_status === 'withdrawn') return 'withdrawn';
  if (assignment.receive_status === 'closed' || assignment.status === 'closed') return 'closed';
  if (assignment.receive_status === 'draft' || assignment.status === 'draft') return 'draft';
  if (assignment.opens_at && new Date(assignment.opens_at).getTime() > Date.now()) return 'scheduled';
  return assignment.receive_status || 'open';
}

export function buildRecipientRows(assignment: Assignment): RecipientStudentRow[] {
  const students = resolveSnapshotStudents(assignment);
  const recipientMap = new Map<string, AssignmentRecipient>();
  store.assignmentRecipients
    .filter((r) => r.assignment_id === assignment.id)
    .forEach((r) => recipientMap.set(r.student_id, r));

  const subsByStudent = new Map<string, Submission[]>();
  store.submissions
    .filter((s) => s.assignment_id === assignment.id)
    .forEach((sub) => {
      const list = subsByStudent.get(sub.student_id) || [];
      list.push(sub);
      subsByStudent.set(sub.student_id, list);
    });

  const receiveStatus = deriveAssignmentReceiveStatus(assignment);

  return students.map((student) => {
    const rec = recipientMap.get(student.id);
    const attempts = (subsByStudent.get(student.id) || []).sort(
      (a, b) => (a.attempt_no || 1) - (b.attempt_no || 1)
    );
    const official = selectOfficialSubmission(attempts, assignment);
    const effectiveDueAt = rec?.due_override_at || assignment.due_date;
    const dueMs = new Date(effectiveDueAt).getTime();
    const isSubmitted = Boolean(official);
    const submittedMs = official ? new Date(official.submitted_at).getTime() : 0;
    const isLate = Boolean(official && submittedMs > dueMs);
    const delayMinutes = isLate ? Math.max(1, Math.round((submittedMs - dueMs) / 60000)) : 0;
    const gradeStatus = deriveSubmissionGradeStatus(official);
    const effectiveScore =
      official && official.score !== undefined && official.score !== null ? official.score : null;

    return {
      student,
      recipientRecord: rec,
      officialSubmission: official,
      allAttempts: attempts,
      attemptCount: attempts.length,
      effectiveDueAt,
      hasPersonalExtension: Boolean(rec?.due_override_at),
      isSubmitted,
      isLate,
      delayMinutes,
      gradeStatus,
      effectiveScore,
      reminderCount: rec?.reminder_count || 0,
      lastRemindedAt: rec?.last_reminded_at || null,
      canExtend: receiveStatus !== 'withdrawn' && receiveStatus !== 'draft',
      canRemind: !isSubmitted && receiveStatus === 'open',
      canGrade: Boolean(official),
      canRevise: Boolean(official && (gradeStatus === 'graded' || gradeStatus === 'published')),
      canPublish: Boolean(official && gradeStatus === 'graded'),
      canRequestResubmit: Boolean(official) && receiveStatus !== 'withdrawn'
    };
  });
}

export function computeRecipientTabCounts(rows: RecipientStudentRow[]): RecipientTabCounts {
  let submitted = 0;
  let pendingGrade = 0;
  let unsubmitted = 0;
  let late = 0;
  let graded = 0;
  let published = 0;

  rows.forEach((row) => {
    if (row.isSubmitted) {
      submitted += 1;
      if (row.isLate) late += 1;
      if (row.gradeStatus === 'graded' || row.gradeStatus === 'published') {
        graded += 1;
        if (row.gradeStatus === 'published') published += 1;
      } else {
        pendingGrade += 1;
      }
    } else {
      unsubmitted += 1;
    }
  });

  return {
    all: rows.length,
    submitted,
    pendingGrade,
    unsubmitted,
    late,
    graded,
    published
  };
}

export function computeAssignmentStats(assignment: Assignment): AssignmentComputedStats {
  const rows = buildRecipientRows(assignment);
  const counts = computeRecipientTabCounts(rows);
  const totalStudents = counts.all;
  const submittedCount = counts.submitted;
  const unsubmittedCount = counts.unsubmitted;
  const gradedCount = counts.graded;
  const publishedCount = counts.published;
  const pendingGradeCount = counts.pendingGrade;
  const draftGradeCount = rows.filter((r) => r.gradeStatus === 'draft_grade').length;

  const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : null;
  const gradingProgress = submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : null;

  // Section 10: Average score ONLY over graded/published submissions with valid numeric score
  const gradedScores = rows
    .filter((r) => (r.gradeStatus === 'graded' || r.gradeStatus === 'published') && r.effectiveScore !== null)
    .map((r) => r.effectiveScore as number);

  const averageScore =
    gradedScores.length > 0
      ? Math.round((gradedScores.reduce((sum, s) => sum + s, 0) / gradedScores.length) * 100) / 100
      : null;

  const effectiveReceiveStatus = deriveAssignmentReceiveStatus(assignment);
  const dueMs = new Date(assignment.due_date).getTime();
  const isPastDueNow = !isNaN(dueMs) && dueMs < Date.now();
  const isOverdueNow =
    isPastDueNow &&
    effectiveReceiveStatus !== 'withdrawn' &&
    effectiveReceiveStatus !== 'draft' &&
    unsubmittedCount > 0;

  let overallGradeStage: GradeStatus = 'ungraded';
  if (submittedCount > 0) {
    if (publishedCount === submittedCount) {
      overallGradeStage = 'published';
    } else if (gradedCount > 0) {
      overallGradeStage = 'graded';
    } else if (draftGradeCount > 0) {
      overallGradeStage = 'draft_grade';
    }
  }

  return {
    totalStudents,
    submittedCount,
    unsubmittedCount,
    lateCount: counts.late,
    gradedCount,
    publishedCount,
    pendingGradeCount,
    draftGradeCount,
    submissionRate,
    gradingProgress,
    averageScore,
    isPastDueNow,
    isOverdueNow,
    effectiveReceiveStatus,
    overallGradeStage
  };
}

export function syncAssignmentDenormalizedCounts(
  assignment: Assignment,
  computed?: AssignmentComputedStats
): AssignmentComputedStats {
  const stats = computed || computeAssignmentStats(assignment);
  assignment.total_students = stats.totalStudents;
  assignment.submitted_count = stats.submittedCount;
  assignment.graded_count = stats.gradedCount;
  return stats;
}

function isAcceptingSubmissions(assignment: Assignment, stats: AssignmentComputedStats): boolean {
  if (stats.effectiveReceiveStatus !== 'open') return false;
  if (!stats.isPastDueNow) return true;
  return Boolean(assignment.allow_late);
}

function formatReceiveStatusLabel(assignment: Assignment, stats: AssignmentComputedStats): string {
  if (stats.effectiveReceiveStatus === 'open' && stats.isPastDueNow) {
    return assignment.allow_late ? 'Quá hạn · Nhận muộn' : 'Đã hết hạn';
  }
  switch (stats.effectiveReceiveStatus) {
    case 'open':
      return 'Đang nhận bài';
    case 'scheduled':
      return 'Chưa mở';
    case 'closed':
      return 'Đã đóng nhận';
    case 'withdrawn':
      return 'Đã thu hồi';
    case 'draft':
    default:
      return 'Bản nháp';
  }
}

export function getPermissionsForAssignment(actor: ActorContext, assignment: Assignment): AssignmentPermissions {
  const hasAccess = canTeacherManageAssignment(actor, assignment);
  const status = deriveAssignmentReceiveStatus(assignment);
  const notWithdrawn = status !== 'withdrawn';
  return {
    canEditMetadata: hasAccess && notWithdrawn,
    canExtend: hasAccess && notWithdrawn && status !== 'draft',
    canClose: hasAccess && (status === 'open' || status === 'scheduled'),
    canReopen: hasAccess && status === 'closed',
    canWithdraw: hasAccess && notWithdrawn,
    canDuplicate: hasAccess,
    canReassign: hasAccess && notWithdrawn,
    canRemind: hasAccess && status === 'open',
    canGrade: hasAccess && notWithdrawn,
    canReviseGrade: hasAccess && notWithdrawn,
    canPublish: hasAccess && notWithdrawn,
    canRequestResubmit: hasAccess && notWithdrawn && status !== 'draft',
    canExport: hasAccess
  };
}

function appendEvent(
  assignmentId: string,
  actor: ActorContext,
  eventType: AssignmentEventType,
  payload: Record<string, any>
) {
  const evt: AssignmentEvent = {
    id: 'aev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    assignment_id: assignmentId,
    actor_id: actor.userId,
    actor_name: actor.fullName,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString()
  };
  store.assignmentEvents.unshift(evt);
  return evt;
}

// Section 8 (MOD-09): Sanitize CSV formula injection (= + - @ \t \r)
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

// Section 10 / TC-05: Safe projection for Student / Parent (hides score & feedback if not published!)
export function getVisibleSubmissionForLearner(submission: Submission): {
  isPublished: boolean;
  visibleScore: number | undefined;
  visibleFeedback: string | undefined;
  gradeStatus: GradeStatus;
} {
  const gradeStatus = deriveSubmissionGradeStatus(submission);
  const isPublished = gradeStatus === 'published';
  return {
    isPublished,
    visibleScore: isPublished ? submission.score : undefined,
    visibleFeedback: isPublished ? submission.feedback : undefined,
    gradeStatus
  };
}

export const AssignmentManagementService = {
  // Reference lists scoped strictly to actor permissions (Section 5 & Section 11)
  async getAuthorizedScopeData(actor: ActorContext): Promise<{
    classes: ClassModel[];
    subjects: Subject[];
  }> {
    assertAuthenticated(actor);
    if (actor.role === 'student' || actor.role === 'parent') {
      throw new ServiceError(403, 'FORBIDDEN', 'Không có quyền xem phạm vi lớp của giáo viên.');
    }
    const allowedClassIds = getAuthorizedClassIds(actor);
    const classes =
      actor.role === 'admin'
        ? [...store.classes]
        : store.classes.filter((c) => allowedClassIds.includes(c.id));

    return {
      classes,
      subjects: [...store.subjects]
    };
  },

  // 1. GET /assignments
  async listAssignments(
    actor: ActorContext,
    query: AssignmentQueryFilters = {}
  ): Promise<{
    items: AssignmentListItem[];
    total: number;
    page: number;
    pageSize: number;
    kpi: AssignmentKpiSummary;
  }> {
    assertAuthenticated(actor);
    if (actor.role === 'student' || actor.role === 'parent') {
      throw new ServiceError(403, 'FORBIDDEN', 'Vai trò này không truy cập được danh sách bài tập giáo viên.');
    }

    // Validate keyword max length 100 chars & trim (Section 5)
    const rawSearch = (query.search || '').trim();
    if (rawSearch.length > 100) {
      throw new ServiceError(400, 'KEYWORD_TOO_LONG', 'Từ khóa tìm kiếm tối đa 100 ký tự.');
    }

    // Validate date range from <= to
    if (query.dateFrom && query.dateTo) {
      if (new Date(query.dateFrom).getTime() > new Date(query.dateTo).getTime()) {
        throw new ServiceError(400, 'INVALID_DATE_RANGE', 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
      }
    }

    // Scope by actor permissions (Section 11 & TC-01)
    const scopedAssignments = store.assignments.filter((a) => canTeacherManageAssignment(actor, a));
    const withStatsAll: AssignmentListItem[] = scopedAssignments.map((assignment) => {
      const stats = syncAssignmentDenormalizedCounts(assignment);
      return { assignment, stats };
    });

    // KPI summary across authorized scope (before optional table filter so KPI reflects teacher's workload, excluding withdrawn)
    const activeScoped = withStatsAll.filter((i) => i.stats.effectiveReceiveStatus !== 'withdrawn');
    const kpi: AssignmentKpiSummary = {
      totalAssignments: activeScoped.length,
      openAssignments: activeScoped.filter((i) => isAcceptingSubmissions(i.assignment, i.stats)).length,
      overdueOrUnsubmittedCount: activeScoped.filter((i) => i.stats.isOverdueNow).length,
      pendingGradeTotal: activeScoped.reduce((sum, i) => sum + i.stats.pendingGradeCount, 0)
    };

    let filtered = [...withStatsAll];

    // By default hide withdrawn unless explicitly queried for 'withdrawn'
    if (query.receiveStatus !== 'withdrawn') {
      filtered = filtered.filter((item) => item.stats.effectiveReceiveStatus !== 'withdrawn');
    }

    if (rawSearch) {
      const qLower = rawSearch.toLowerCase();
      filtered = filtered.filter(({ assignment }) => {
        const topicTitles = (assignment.topic_ids || [])
          .map((tid) => store.lessonTopics.find((t) => t.id === tid)?.title || '')
          .join(' ')
          .toLowerCase();
        return (
          assignment.title.toLowerCase().includes(qLower) ||
          (assignment.code || '').toLowerCase().includes(qLower) ||
          assignment.class_name.toLowerCase().includes(qLower) ||
          assignment.subject_name.toLowerCase().includes(qLower) ||
          topicTitles.includes(qLower)
        );
      });
    }

    if (query.classIds && query.classIds.length > 0) {
      filtered = filtered.filter(({ assignment }) => query.classIds!.includes(assignment.class_id));
    }

    if (query.subjectIds && query.subjectIds.length > 0) {
      filtered = filtered.filter(({ assignment }) => query.subjectIds!.includes(assignment.subject_id));
    }

    if (query.type && query.type !== 'all') {
      filtered = filtered.filter(({ assignment }) => (assignment.type || 'homework') === query.type);
    }

    if (query.receiveStatus && query.receiveStatus !== 'all') {
      if (query.receiveStatus === 'overdue_unsubmitted') {
        filtered = filtered.filter(({ stats }) => stats.isOverdueNow);
      } else if (query.receiveStatus === 'open') {
        filtered = filtered.filter(({ assignment, stats }) => isAcceptingSubmissions(assignment, stats));
      } else {
        filtered = filtered.filter(({ stats }) => stats.effectiveReceiveStatus === query.receiveStatus);
      }
    }

    if (query.gradingFilter && query.gradingFilter !== 'all') {
      filtered = filtered.filter(({ stats }) => {
        if (query.gradingFilter === 'pending_grade') return stats.pendingGradeCount > 0;
        if (query.gradingFilter === 'partially_graded') {
          return stats.gradedCount > 0 && stats.gradedCount < stats.submittedCount;
        }
        if (query.gradingFilter === 'fully_graded') {
          return stats.submittedCount > 0 && stats.gradedCount === stats.submittedCount;
        }
        if (query.gradingFilter === 'published') {
          return stats.submittedCount > 0 && stats.publishedCount === stats.submittedCount;
        }
        return true;
      });
    }

    if (query.dateFrom) {
      const fromMs = new Date(`${query.dateFrom}T00:00:00`).getTime();
      filtered = filtered.filter(({ assignment }) => {
        const refMs = new Date(assignment.due_date).getTime();
        return refMs >= fromMs;
      });
    }

    if (query.dateTo) {
      const toMs = new Date(`${query.dateTo}T23:59:59`).getTime();
      filtered = filtered.filter(({ assignment }) => {
        const refMs = new Date(assignment.due_date).getTime();
        return refMs <= toMs;
      });
    }

    // Sort (Section 5)
    const sortMode = query.sort || 'newest_assigned';
    filtered.sort((a, b) => {
      if (sortMode === 'nearest_due') {
        return new Date(a.assignment.due_date).getTime() - new Date(b.assignment.due_date).getTime();
      }
      if (sortMode === 'lowest_submission_rate') {
        const rateA = a.stats.submissionRate ?? 101;
        const rateB = b.stats.submissionRate ?? 101;
        return rateA - rateB;
      }
      if (sortMode === 'highest_pending_grade') {
        return b.stats.pendingGradeCount - a.stats.pendingGradeCount;
      }
      return new Date(b.assignment.created_at).getTime() - new Date(a.assignment.created_at).getTime();
    });

    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
    const page = query.page && query.page > 0 ? query.page : 1;
    const total = filtered.length;
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    return { items, total, page, pageSize, kpi };
  },

  // 2. GET /assignments/:id
  async getAssignmentDetail(
    actor: ActorContext,
    assignmentId: string
  ): Promise<{
    assignment: Assignment;
    summary: AssignmentComputedStats;
    permissions: AssignmentPermissions;
    events: AssignmentEvent[];
    revisions: GradeRevision[];
    publishableSubmissionIds: string[];
    unsubmittedStudentIds: string[];
  }> {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, assignment);

    const allRows = buildRecipientRows(assignment);
    const summary = syncAssignmentDenormalizedCounts(assignment, computeAssignmentStats(assignment));
    const publishableSubmissionIds = allRows
      .filter((r) => r.officialSubmission && r.gradeStatus === 'graded')
      .map((r) => r.officialSubmission!.id);
    const unsubmittedStudentIds = allRows.filter((r) => !r.isSubmitted).map((r) => r.student.id);

    return {
      assignment: { ...assignment },
      summary,
      permissions: getPermissionsForAssignment(actor, assignment),
      events: store.assignmentEvents
        .filter((e) => e.assignment_id === assignmentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      revisions: store.gradeRevisions
        .filter((r) => r.assignment_id === assignmentId)
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()),
      publishableSubmissionIds,
      unsubmittedStudentIds
    };
  },

  // 3. GET /assignments/:id/recipients
  async getAssignmentRecipients(
    actor: ActorContext,
    assignmentId: string,
    query: {
      tab?: RecipientTab;
      onlyPendingGrade?: boolean;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    rows: RecipientStudentRow[];
    counts: RecipientTabCounts;
    total: number;
  }> {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, assignment);

    const allRows = buildRecipientRows(assignment);
    const counts = computeRecipientTabCounts(allRows);
    const tab = query.tab || 'all';

    let rows = allRows.filter((row) => {
      if (tab === 'submitted') {
        if (!row.isSubmitted) return false;
        if (query.onlyPendingGrade) {
          return row.gradeStatus === 'ungraded' || row.gradeStatus === 'draft_grade';
        }
        return true;
      }
      if (tab === 'unsubmitted') return !row.isSubmitted;
      if (tab === 'late') return row.isLate;
      if (tab === 'graded') return row.gradeStatus === 'graded' || row.gradeStatus === 'published';
      return true;
    });

    const rawSearch = (query.search || '').trim().toLowerCase();
    if (rawSearch) {
      rows = rows.filter(
        (r) =>
          r.student.full_name.toLowerCase().includes(rawSearch) ||
          r.student.student_code.toLowerCase().includes(rawSearch)
      );
    }

    const total = rows.length;
    if (query.page && query.pageSize) {
      const start = (query.page - 1) * query.pageSize;
      rows = rows.slice(start, start + query.pageSize);
    }

    return { rows, counts, total };
  },

  // ACT-04: Safe metadata update + version check
  async updateAssignmentMetadata(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      title: string;
      description: string;
      allow_late: boolean;
      points_max?: number;
      max_attempts?: number;
      grading_policy?: Assignment['grading_policy'];
      special_instructions?: string;
      createNewContentVersion?: boolean;
    },
    expectedVersion: number
  ): Promise<Assignment> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const existing = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, existing);

    if ((existing.version || 1) !== expectedVersion) {
      throw new ServiceError(
        409,
        'VERSION_CONFLICT',
        'Dữ liệu bài tập đã bị thay đổi bởi thao tác khác. Vui lòng tải mới trước khi lưu.'
      );
    }
    if (deriveAssignmentReceiveStatus(existing) === 'withdrawn') {
      throw new ServiceError(422, 'ASSIGNMENT_WITHDRAWN', 'Không thể chỉnh sửa bài tập đã thu hồi.');
    }
    if (!payload.title || !payload.title.trim()) {
      throw new ServiceError(400, 'INVALID_TITLE', 'Tiêu đề bài tập không được để trống.');
    }

    const hasSubmissions = store.submissions.some((s) => s.assignment_id === assignmentId);
    const nextContentVersion =
      hasSubmissions && payload.createNewContentVersion
        ? (existing.content_version || 1) + 1
        : existing.content_version || 1;

    // Section 10: Do not silently alter grading_policy once submissions exist unless explicitly forced on new version
    const effectivePolicy =
      hasSubmissions && !payload.createNewContentVersion
        ? existing.grading_policy
        : payload.grading_policy || existing.grading_policy;

    const updated: Assignment = {
      ...existing,
      title: payload.title.trim(),
      description: payload.description.trim(),
      allow_late: payload.allow_late,
      max_attempts: payload.max_attempts ?? existing.max_attempts,
      grading_policy: effectivePolicy,
      special_instructions: payload.special_instructions ?? existing.special_instructions,
      content_version: nextContentVersion,
      version: (existing.version || 1) + 1,
      updated_at: new Date().toISOString()
    };

    store.assignments[idx] = updated;
    appendEvent(assignmentId, actor, 'edit_metadata', {
      title: updated.title,
      allow_late: updated.allow_late,
      content_version: nextContentVersion
    });
    store.logAudit('EDIT_ASSIGNMENT_METADATA', 'assignments', assignmentId, `Cập nhật metadata bài: ${updated.title}`, actor.fullName, actor.role);
    store.notify();
    return updated;
  },

  // 4. POST /assignments/:id/extend (MOD-01, TC-06)
  async extendDeadline(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      recipient_ids?: string[]; // empty/undefined => toàn lớp; array => gia hạn cá nhân riêng từng học sinh
      new_due_at: string;
      reason: string;
      version: number;
    }
  ): Promise<{ assignment: Assignment; updatedStudentIds: string[] }> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const existing = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, existing);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(409, 'VERSION_CONFLICT', 'Phiên bản bài tập đã thay đổi, vui lòng tải lại.');
    }
    const status = deriveAssignmentReceiveStatus(existing);
    if (status === 'withdrawn' || status === 'draft') {
      throw new ServiceError(422, 'INVALID_STATUS', 'Chỉ có thể gia hạn cho bài tập đã phát hành.');
    }

    const newDueMs = new Date(payload.new_due_at).getTime();
    if (isNaN(newDueMs) || newDueMs <= Date.now()) {
      throw new ServiceError(400, 'INVALID_DUE_DATE', 'Thời hạn mới phải sau thời điểm hiện tại.');
    }
    const reason = (payload.reason || '').trim();
    if (reason.length < 10 || reason.length > 500) {
      throw new ServiceError(400, 'INVALID_REASON', 'Lý do gia hạn phải từ 10 đến 500 ký tự.');
    }

    const nowIso = new Date().toISOString();
    const targetIds = payload.recipient_ids && payload.recipient_ids.length > 0 ? payload.recipient_ids : null;
    const updatedStudentIds: string[] = [];

    if (!targetIds) {
      // Toàn lớp
      store.assignments[idx] = {
        ...existing,
        due_date: new Date(newDueMs).toISOString(),
        version: (existing.version || 1) + 1,
        updated_at: nowIso
      };
      resolveSnapshotStudents(existing).forEach((s) => updatedStudentIds.push(s.id));
    } else {
      // Cá nhân: KHÔNG làm thay đổi assignment.due_date hay due_override_at của học sinh khác (TC-06)
      const snapshotSet = new Set(resolveSnapshotStudents(existing).map((s) => s.id));
      targetIds.forEach((studentId) => {
        if (!snapshotSet.has(studentId)) return;
        const recIdx = store.assignmentRecipients.findIndex(
          (r) => r.assignment_id === assignmentId && r.student_id === studentId
        );
        if (recIdx >= 0) {
          store.assignmentRecipients[recIdx] = {
            ...store.assignmentRecipients[recIdx],
            due_override_at: new Date(newDueMs).toISOString()
          };
        } else {
          store.assignmentRecipients.push({
            id: 'rec-' + assignmentId + '-' + studentId,
            assignment_id: assignmentId,
            student_id: studentId,
            due_override_at: new Date(newDueMs).toISOString(),
            assigned_at: existing.created_at,
            status: 'assigned',
            extra_attempts: 0,
            reminder_count: 0,
            last_reminded_at: null
          });
        }
        updatedStudentIds.push(studentId);
      });

      if (updatedStudentIds.length === 0) {
        throw new ServiceError(400, 'NO_VALID_RECIPIENTS', 'Không có học sinh hợp lệ được chọn để gia hạn.');
      }

      store.assignments[idx] = {
        ...existing,
        version: (existing.version || 1) + 1,
        updated_at: nowIso
      };
    }

    appendEvent(assignmentId, actor, 'extend', {
      scope: targetIds ? 'individual' : 'class',
      student_ids: updatedStudentIds,
      new_due_at: new Date(newDueMs).toISOString(),
      reason
    });
    store.logAudit(
      'EXTEND_DEADLINE',
      'assignments',
      assignmentId,
      `Gia hạn ${targetIds ? `${updatedStudentIds.length} học sinh` : 'toàn lớp'} đến ${new Date(newDueMs).toLocaleString('vi-VN')}: ${reason}`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return { assignment: store.assignments[idx], updatedStudentIds };
  },

  // 5. POST /assignments/:id/remind (MOD-02, FLOW-04, TC-09)
  async sendReminder(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      recipient_ids: string[];
      channel: NotificationChannel;
      message: string;
    }
  ): Promise<{
    job: NotificationJob;
    deliveries: NotificationDelivery[];
    sentCount: number;
    skippedDuplicateCount: number;
    failedCount: number;
  }> {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, assignment);

    if (deriveAssignmentReceiveStatus(assignment) !== 'open') {
      throw new ServiceError(422, 'ASSIGNMENT_NOT_OPEN', 'Chỉ có thể gửi nhắc nộp khi bài tập đang mở nhận bài.');
    }

    const msg = (payload.message || '').trim();
    if (!msg || msg.length > 1000) {
      throw new ServiceError(400, 'INVALID_MESSAGE', 'Nội dung nhắc nộp phải từ 1 đến 1000 ký tự.');
    }
    if (!payload.recipient_ids || payload.recipient_ids.length === 0) {
      throw new ServiceError(400, 'EMPTY_RECIPIENTS', 'Vui lòng chọn ít nhất một học sinh cần nhắc.');
    }

    const rows = buildRecipientRows(assignment);
    const rowMap = new Map(rows.map((r) => [r.student.id, r]));
    const nowMs = Date.now();
    const cooldownMs = BUSINESS_POLICY_DEFAULTS.reminderCooldownMinutes * 60 * 1000;
    const jobId = 'njob-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const nowIso = new Date().toISOString();

    const deliveries: NotificationDelivery[] = [];
    let sentCount = 0;
    let skippedDuplicateCount = 0;
    let failedCount = 0;

    payload.recipient_ids.forEach((studentId) => {
      const row = rowMap.get(studentId);
      if (!row) {
        failedCount += 1;
        deliveries.push({
          id: 'ndel-' + Math.random().toString(36).slice(2, 9),
          job_id: jobId,
          assignment_id: assignmentId,
          recipient_id: studentId,
          recipient_name: studentId,
          channel: payload.channel,
          status: 'failed',
          error: 'Học sinh không thuộc danh sách nhận bài này'
        });
        return;
      }

      if (row.isSubmitted) {
        failedCount += 1;
        deliveries.push({
          id: 'ndel-' + Math.random().toString(36).slice(2, 9),
          job_id: jobId,
          assignment_id: assignmentId,
          recipient_id: studentId,
          recipient_name: row.student.full_name,
          channel: payload.channel,
          status: 'failed',
          error: 'Học sinh đã nộp bài, không đủ điều kiện nhắc'
        });
        return;
      }

      // Check anti-duplicate / anti-spam window (TC-09)
      const prevSentSameChannel = store.notificationDeliveries.find(
        (d) =>
          d.assignment_id === assignmentId &&
          d.recipient_id === studentId &&
          d.channel === payload.channel &&
          d.status === 'sent' &&
          d.sent_at &&
          nowMs - new Date(d.sent_at).getTime() < cooldownMs
      );
      const lastRecRemindedMs = row.lastRemindedAt ? new Date(row.lastRemindedAt).getTime() : 0;
      const recentlyReminded =
        Boolean(prevSentSameChannel) || (lastRecRemindedMs > 0 && nowMs - lastRecRemindedMs < cooldownMs);

      if (recentlyReminded) {
        skippedDuplicateCount += 1;
        deliveries.push({
          id: 'ndel-' + Math.random().toString(36).slice(2, 9),
          job_id: jobId,
          assignment_id: assignmentId,
          recipient_id: studentId,
          recipient_name: row.student.full_name,
          channel: payload.channel,
          status: 'skipped_duplicate',
          error: `Đã nhắc trong vòng ${BUSINESS_POLICY_DEFAULTS.reminderCooldownMinutes} phút gần đây (chống gửi trùng)`
        });
        return;
      }

      // Check channel readiness (e.g. parent_app requires parent connected)
      if (payload.channel === 'parent_app' && row.student.app_connected === false) {
        failedCount += 1;
        deliveries.push({
          id: 'ndel-' + Math.random().toString(36).slice(2, 9),
          job_id: jobId,
          assignment_id: assignmentId,
          recipient_id: studentId,
          recipient_name: row.student.full_name,
          channel: payload.channel,
          status: 'failed',
          error: 'Phụ huynh chưa kết nối ứng dụng Smart Class'
        });
        return;
      }

      // Send OK
      sentCount += 1;
      const delivery: NotificationDelivery = {
        id: 'ndel-' + Math.random().toString(36).slice(2, 9),
        job_id: jobId,
        assignment_id: assignmentId,
        recipient_id: studentId,
        recipient_name: row.student.full_name,
        channel: payload.channel,
        status: 'sent',
        sent_at: nowIso
      };
      deliveries.push(delivery);
      store.notificationDeliveries.unshift(delivery);

      const recIdx = store.assignmentRecipients.findIndex(
        (r) => r.assignment_id === assignmentId && r.student_id === studentId
      );
      if (recIdx >= 0) {
        store.assignmentRecipients[recIdx] = {
          ...store.assignmentRecipients[recIdx],
          reminder_count: (store.assignmentRecipients[recIdx].reminder_count || 0) + 1,
          last_reminded_at: nowIso
        };
      } else {
        store.assignmentRecipients.push({
          id: 'rec-' + assignmentId + '-' + studentId,
          assignment_id: assignmentId,
          student_id: studentId,
          due_override_at: null,
          assigned_at: assignment.created_at,
          status: 'assigned',
          extra_attempts: 0,
          reminder_count: 1,
          last_reminded_at: nowIso
        });
      }
    });

    const job: NotificationJob = {
      id: jobId,
      assignment_id: assignmentId,
      created_by: actor.userId,
      created_by_name: actor.fullName,
      type: 'reminder',
      channel: payload.channel,
      message: msg,
      status: failedCount > 0 && sentCount === 0 ? 'failed' : failedCount > 0 || skippedDuplicateCount > 0 ? 'partial' : 'completed',
      created_at: nowIso
    };
    store.notificationJobs.unshift(job);

    appendEvent(assignmentId, actor, 'remind', {
      job_id: jobId,
      channel: payload.channel,
      sentCount,
      skippedDuplicateCount,
      failedCount
    });
    store.logAudit(
      'REMIND_ASSIGNMENT',
      'assignments',
      assignmentId,
      `Nhắc nộp bài (${payload.channel}): ${sentCount} gửi thành công, ${skippedDuplicateCount} bỏ qua trùng, ${failedCount} lỗi`,
      actor.fullName,
      actor.role
    );
    store.notify();

    return { job, deliveries, sentCount, skippedDuplicateCount, failedCount };
  },

  // 6. POST /assignments/:id/close (MOD-05, FLOW-06, TC-07)
  async closeAssignment(
    actor: ActorContext,
    assignmentId: string,
    payload: { reason: string; version: number }
  ): Promise<Assignment> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const existing = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, existing);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(409, 'VERSION_CONFLICT', 'Dữ liệu bài tập đã thay đổi, vui lòng tải lại.');
    }
    const status = deriveAssignmentReceiveStatus(existing);
    if (status === 'closed' || status === 'withdrawn') {
      throw new ServiceError(422, 'ALREADY_CLOSED', 'Bài tập hiện đã ở trạng thái đóng hoặc thu hồi.');
    }
    const reason = (payload.reason || '').trim();
    if (reason.length < 5) {
      throw new ServiceError(400, 'INVALID_REASON', 'Vui lòng nhập lý do đóng nhận bài (tối thiểu 5 ký tự).');
    }

    const updated: Assignment = {
      ...existing,
      receive_status: 'closed',
      status: 'closed',
      version: (existing.version || 1) + 1,
      updated_at: new Date().toISOString()
    };
    store.assignments[idx] = updated;
    appendEvent(assignmentId, actor, 'close', { reason });
    store.logAudit('CLOSE_ASSIGNMENT', 'assignments', assignmentId, `Đóng nhận bài: ${existing.title} — Lý do: ${reason}`, actor.fullName, actor.role);
    store.notify();
    return updated;
  },

  // 7. POST /assignments/:id/reopen (MOD-05, ACT-09)
  async reopenAssignment(
    actor: ActorContext,
    assignmentId: string,
    payload: { reason: string; new_due_at?: string; version: number }
  ): Promise<Assignment> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const existing = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, existing);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(409, 'VERSION_CONFLICT', 'Dữ liệu bài tập đã thay đổi, vui lòng tải lại.');
    }
    const status = deriveAssignmentReceiveStatus(existing);
    if (status !== 'closed') {
      throw new ServiceError(422, 'NOT_CLOSED', 'Chỉ có thể mở lại bài tập đang ở trạng thái Đã đóng.');
    }
    const reason = (payload.reason || '').trim();
    if (reason.length < 5) {
      throw new ServiceError(400, 'INVALID_REASON', 'Vui lòng nhập lý do mở lại nhận bài.');
    }
    let nextDue = existing.due_date;
    if (payload.new_due_at) {
      const ms = new Date(payload.new_due_at).getTime();
      if (isNaN(ms) || ms <= Date.now()) {
        throw new ServiceError(400, 'INVALID_DUE_DATE', 'Thời hạn mới khi mở lại phải sau thời điểm hiện tại.');
      }
      nextDue = new Date(ms).toISOString();
    }

    const updated: Assignment = {
      ...existing,
      due_date: nextDue,
      receive_status: 'open',
      status: 'published',
      version: (existing.version || 1) + 1,
      updated_at: new Date().toISOString()
    };
    store.assignments[idx] = updated;
    appendEvent(assignmentId, actor, 'reopen', { reason, new_due_at: nextDue });
    store.logAudit('REOPEN_ASSIGNMENT', 'assignments', assignmentId, `Mở lại nhận bài: ${existing.title} — ${reason}`, actor.fullName, actor.role);
    store.notify();
    return updated;
  },

  // 8. POST /assignments/:id/withdraw (MOD-06, TC-08)
  async withdrawAssignment(
    actor: ActorContext,
    assignmentId: string,
    payload: { reason: string; confirmation: string; version: number }
  ): Promise<Assignment> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const existing = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, existing);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(409, 'VERSION_CONFLICT', 'Dữ liệu bài tập đã thay đổi, vui lòng tải lại.');
    }
    if (deriveAssignmentReceiveStatus(existing) === 'withdrawn') {
      throw new ServiceError(422, 'ALREADY_WITHDRAWN', 'Bài tập này đã được thu hồi trước đó.');
    }
    const reason = (payload.reason || '').trim();
    if (reason.length < 5) {
      throw new ServiceError(400, 'INVALID_REASON', 'Vui lòng nhập lý do thu hồi (tối thiểu 5 ký tự).');
    }
    const conf = (payload.confirmation || '').trim();
    const expectedExact = existing.title.trim();
    if (conf !== expectedExact && conf.toUpperCase() !== 'XÁC NHẬN' && conf.toUpperCase() !== 'THU HỒI') {
      throw new ServiceError(
        400,
        'CONFIRMATION_MISMATCH',
        'Vui lòng nhập chính xác tên bài tập hoặc gõ "XÁC NHẬN" để thu hồi.'
      );
    }

    // Soft-withdraw: NEVER hard-delete submissions or grades! (TC-08)
    const nowIso = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      receive_status: 'withdrawn',
      status: 'closed',
      withdrawn_at: nowIso,
      withdrawn_reason: reason,
      version: (existing.version || 1) + 1,
      updated_at: nowIso
    };
    store.assignments[idx] = updated;
    appendEvent(assignmentId, actor, 'withdraw', { reason });
    store.logAudit(
      'WITHDRAW_ASSIGNMENT',
      'assignments',
      assignmentId,
      `Thu hồi mềm bài tập "${existing.title}" (giữ toàn bộ dữ liệu nộp & điểm): ${reason}`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return updated;
  },

  // 9. POST /assignments/:id/duplicate (ACT-05 Sao chép, ACT-06 / MOD-07 Giao lại)
  async duplicateOrReassignAssignment(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      mode: 'copy' | 'reassign';
      target_class_ids: string[];
      recipient_ids?: string[];
      due_at: string;
      title?: string;
      allow_late?: boolean;
      max_attempts?: number;
      prevent_duplicate_in_same_class?: boolean;
    }
  ): Promise<Assignment[]> {
    const source = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, source);

    if (!payload.target_class_ids || payload.target_class_ids.length === 0) {
      throw new ServiceError(400, 'EMPTY_CLASSES', 'Vui lòng chọn ít nhất một lớp đích.');
    }
    const dueMs = new Date(payload.due_at).getTime();
    if (isNaN(dueMs) || dueMs <= Date.now()) {
      throw new ServiceError(400, 'INVALID_DUE_DATE', 'Thời hạn mới phải sau thời điểm hiện tại.');
    }

    const allowedClassIds = getAuthorizedClassIds(actor);
    const createdInstances: Assignment[] = [];
    const nowIso = new Date().toISOString();

    for (const classId of payload.target_class_ids) {
      if (actor.role !== 'admin' && !allowedClassIds.includes(classId)) {
        throw new ServiceError(
          403,
          'FORBIDDEN_CLASS_SCOPE',
          `Bạn không được phân công giảng dạy lớp ${classId}.`
        );
      }

      const cls = store.classes.find((c) => c.id === classId);
      if (!cls) {
        throw new ServiceError(404, 'CLASS_NOT_FOUND', `Không tìm thấy lớp học ${classId}.`);
      }

      const candidateTitle =
        payload.title?.trim() ||
        (payload.mode === 'copy' ? `[Bản sao] ${source.title}` : source.title);

      if (payload.prevent_duplicate_in_same_class) {
        const dup = store.assignments.find(
          (a) =>
            a.class_id === classId &&
            a.title.toLowerCase() === candidateTitle.toLowerCase() &&
            deriveAssignmentReceiveStatus(a) !== 'withdrawn'
        );
        if (dup) {
          throw new ServiceError(
            422,
            'DUPLICATE_ASSIGNMENT',
            `Lớp ${cls.name} đang có bài tập trùng tên "${candidateTitle}".`
          );
        }
      }

      const isDraftCopy = payload.mode === 'copy';
      const newId = 'asg-' + Math.random().toString(36).slice(2, 9);
      const classStudents = store.students.filter((s) => s.class_id === classId);
      const targetStudentList =
        payload.recipient_ids && payload.recipient_ids.length > 0 && payload.target_class_ids.length === 1
          ? classStudents.filter((s) => payload.recipient_ids!.includes(s.id))
          : classStudents;

      const newAssignment: Assignment = {
        ...source,
        id: newId,
        code: `${(source.code || 'BT').split('-')[0]}-${Math.floor(100 + Math.random() * 900)}`,
        class_id: classId,
        class_name: cls.name,
        teacher_id: actor.userId,
        teacher_name: actor.fullName,
        title: candidateTitle,
        opens_at: nowIso,
        due_date: new Date(dueMs).toISOString(),
        allow_late: payload.allow_late ?? source.allow_late,
        max_attempts: payload.max_attempts ?? source.max_attempts ?? 3,
        status: isDraftCopy ? 'draft' : 'published',
        receive_status: isDraftCopy ? 'draft' : 'open',
        version: 1,
        content_version: source.content_version || 1,
        withdrawn_at: null,
        withdrawn_reason: undefined,
        // Never copy submissions or scores (ACT-05)
        submitted_count: 0,
        graded_count: 0,
        total_students: targetStudentList.length,
        created_at: nowIso,
        updated_at: nowIso
      };

      store.assignments.unshift(newAssignment);
      targetStudentList.forEach((stu) => {
        store.assignmentRecipients.push({
          id: 'rec-' + newId + '-' + stu.id,
          assignment_id: newId,
          student_id: stu.id,
          due_override_at: null,
          assigned_at: nowIso,
          status: 'assigned',
          extra_attempts: 0,
          reminder_count: 0,
          last_reminded_at: null
        });
      });

      appendEvent(newId, actor, payload.mode === 'copy' ? 'duplicate' : 'reassign', {
        source_assignment_id: source.id,
        class_id: classId,
        class_name: cls.name,
        mode: payload.mode
      });
      createdInstances.push(newAssignment);
    }

    appendEvent(source.id, actor, payload.mode === 'copy' ? 'duplicate' : 'reassign', {
      created_ids: createdInstances.map((i) => i.id),
      target_class_ids: payload.target_class_ids
    });
    store.logAudit(
      payload.mode === 'copy' ? 'DUPLICATE_ASSIGNMENT' : 'REASSIGN_ASSIGNMENT',
      'assignments',
      source.id,
      `${payload.mode === 'copy' ? 'Sao chép nháp' : 'Giao lại'} bài "${source.title}" sang ${createdInstances.map((i) => i.class_name).join(', ')}`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return createdInstances;
  },

  // 10. GET /submissions/:id
  async getSubmissionDetail(
    actor: ActorContext,
    submissionId: string
  ): Promise<{
    submission: Submission;
    assignment: Assignment;
    student?: Student;
    allAttempts: Submission[];
    revisions: GradeRevision[];
    fileValidations: Array<{ name: string; valid: boolean; reason?: string }>;
  }> {
    const submission = store.submissions.find((s) => s.id === submissionId);
    if (!submission) {
      throw new ServiceError(404, 'SUBMISSION_NOT_FOUND', 'Không tìm thấy bài nộp.');
    }
    const assignment = store.assignments.find((a) => a.id === submission.assignment_id);
    assertCanAccessAssignment(actor, assignment);

    const allAttempts = store.submissions
      .filter((s) => s.assignment_id === submission.assignment_id && s.student_id === submission.student_id)
      .sort((a, b) => (b.attempt_no || 1) - (a.attempt_no || 1));

    const revisions = store.gradeRevisions
      .filter((r) => r.submission_id === submissionId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

    const fileValidations = (submission.files || []).map((f) => {
      const sizeOk = !f.size_bytes || f.size_bytes <= BUSINESS_POLICY_DEFAULTS.maxAttachmentSizeBytes;
      const mimeOk = !f.mime || BUSINESS_POLICY_DEFAULTS.allowedAttachmentMimes.includes(f.mime);
      return {
        name: f.name,
        valid: sizeOk && mimeOk,
        reason: !sizeOk
          ? 'Vượt quá dung lượng tối đa 10MB'
          : !mimeOk
          ? 'Định dạng file không thuộc danh sách an toàn'
          : undefined
      };
    });

    return {
      submission: { ...submission },
      assignment: { ...assignment },
      student: store.students.find((s) => s.id === submission.student_id),
      allAttempts,
      revisions,
      fileValidations
    };
  },

  // 11. PUT /submissions/:id/grade (ACT-12, FLOW-02, TC-04, TC-05)
  async gradeSubmission(
    actor: ActorContext,
    submissionId: string,
    payload: {
      score: number;
      feedback: string;
      status: 'draft_grade' | 'graded';
      publishNow?: boolean;
      version: number;
    }
  ): Promise<{ submission: Submission; stats: AssignmentComputedStats }> {
    const idx = store.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) {
      throw new ServiceError(404, 'SUBMISSION_NOT_FOUND', 'Không tìm thấy bài nộp để chấm.');
    }
    const existing = store.submissions[idx];
    const assignment = store.assignments.find((a) => a.id === existing.assignment_id);
    assertCanAccessAssignment(actor, assignment);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(
        409,
        'VERSION_CONFLICT',
        'Điểm bài nộp này đã bị thay đổi trước đó. Vui lòng tải lại dữ liệu mới nhất trước khi lưu.'
      );
    }

    const maxScore = assignment.points_max || 10;
    const step = assignment.score_step || 0.25;
    if (typeof payload.score !== 'number' || isNaN(payload.score) || payload.score < 0 || payload.score > maxScore) {
      throw new ServiceError(400, 'INVALID_SCORE', `Điểm số phải nằm trong khoảng 0 đến ${maxScore}.`);
    }
    // Check score step tolerance (e.g. 0.25 -> score * 4 integer, or 0.5 -> score * 2 integer)
    const stepRatio = Math.round((payload.score / step) * 1000) / 1000;
    if (Math.abs(stepRatio - Math.round(stepRatio)) > 0.001) {
      throw new ServiceError(400, 'INVALID_SCORE_STEP', `Điểm số phải chia hết cho bước điểm ${step}.`);
    }

    const shouldPublish =
      payload.status === 'graded' && (Boolean(payload.publishNow) || Boolean(assignment.auto_publish_on_grade));
    const nextGradeStatus: GradeStatus =
      payload.status === 'draft_grade' ? 'draft_grade' : shouldPublish ? 'published' : 'graded';

    const nowIso = new Date().toISOString();
    const updated: Submission = {
      ...existing,
      score: Math.round(payload.score * 100) / 100,
      feedback: (payload.feedback || '').trim(),
      grade_status: nextGradeStatus,
      graded_by: actor.fullName,
      graded_at: payload.status === 'graded' ? nowIso : existing.graded_at,
      published_at: shouldPublish ? nowIso : existing.published_at,
      status: payload.status === 'graded' ? 'graded' : existing.status,
      version: (existing.version || 1) + 1
    };

    store.submissions[idx] = updated;
    const stats = syncAssignmentDenormalizedCounts(assignment);
    assignment.updated_at = nowIso;

    appendEvent(assignment.id, actor, 'grade', {
      submission_id: submissionId,
      student_id: existing.student_id,
      student_name: existing.student_name,
      score: updated.score,
      grade_status: nextGradeStatus
    });

    store.logAudit(
      payload.status === 'draft_grade' ? 'SAVE_DRAFT_GRADE' : 'GRADE_SUBMISSION',
      'submissions',
      submissionId,
      `${payload.status === 'draft_grade' ? 'Lưu nháp' : shouldPublish ? 'Chấm & công bố' : 'Hoàn tất chấm'} bài ${existing.student_name}: ${updated.score}/${maxScore}đ`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return { submission: updated, stats };
  },

  // 11b. Direct offline/in-class submission & optional grading for unsubmitted students
  async recordDirectSubmissionAndGrade(
    actor: ActorContext,
    assignmentId: string,
    studentId: string,
    payload: {
      note: string;
      score?: number | null;
      feedback?: string;
      gradeStatus?: 'ungraded' | 'draft_grade' | 'graded' | 'published';
    }
  ): Promise<{ submission: Submission; stats: AssignmentComputedStats }> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const assignment = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, assignment);

    const recStatus = deriveAssignmentReceiveStatus(assignment);
    if (recStatus === 'withdrawn' || recStatus === 'draft') {
      throw new ServiceError(422, 'INVALID_STATUS', 'Không thể ghi nhận bài nộp cho bài tập đang nháp hoặc đã thu hồi.');
    }

    const snapshotStudents = resolveSnapshotStudents(assignment);
    const student = snapshotStudents.find((s) => s.id === studentId);
    if (!student) {
      throw new ServiceError(404, 'STUDENT_NOT_IN_ASSIGNMENT', 'Học sinh không nằm trong danh sách giao bài này.');
    }

    const note = (payload.note || '').trim();
    if (note.length < 3) {
      throw new ServiceError(400, 'INVALID_NOTE', 'Vui lòng nhập ghi chú hình thức nộp bài (tối thiểu 3 ký tự).');
    }

    const desiredGradeStatus: GradeStatus =
      payload.score !== undefined && payload.score !== null
        ? payload.gradeStatus || 'graded'
        : 'ungraded';

    if (payload.score !== undefined && payload.score !== null) {
      const maxScore = assignment.points_max || 10;
      const step = assignment.score_step || 0.25;
      if (isNaN(payload.score) || payload.score < 0 || payload.score > maxScore) {
        throw new ServiceError(400, 'INVALID_SCORE', `Điểm số phải nằm trong khoảng 0 đến ${maxScore}.`);
      }
      const stepRatio = Math.round((payload.score / step) * 1000) / 1000;
      if (Math.abs(stepRatio - Math.round(stepRatio)) > 0.001) {
        throw new ServiceError(400, 'INVALID_SCORE_STEP', `Điểm số phải chia hết cho bước điểm ${step}.`);
      }
    }

    const prevSubs = store.submissions.filter(
      (s) => s.assignment_id === assignmentId && s.student_id === studentId
    );
    prevSubs.forEach((s) => {
      s.is_official = false;
    });

    const rec = store.assignmentRecipients.find(
      (r) => r.assignment_id === assignmentId && r.student_id === studentId
    );
    const effectiveDueMs = new Date(rec?.due_override_at || assignment.due_date).getTime();
    const nowIso = new Date().toISOString();
    const isLate = Date.now() > effectiveDueMs;
    const isGradedFinal = desiredGradeStatus === 'graded' || desiredGradeStatus === 'published';

    const newSub: Submission = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      assignment_id: assignmentId,
      student_id: student.id,
      student_name: student.full_name,
      student_code: student.student_code,
      attempt_no: prevSubs.length + 1,
      submitted_at: nowIso,
      content: `[Ghi nhận trực tiếp bởi ${actor.fullName}] ${note}`,
      files: [],
      score: payload.score !== undefined && payload.score !== null ? Math.round(payload.score * 100) / 100 : undefined,
      feedback: (payload.feedback || '').trim(),
      grade_status: desiredGradeStatus,
      graded_by: payload.score !== undefined && payload.score !== null ? actor.fullName : undefined,
      graded_at: isGradedFinal ? nowIso : undefined,
      published_at: desiredGradeStatus === 'published' ? nowIso : undefined,
      version: 1,
      status: isGradedFinal ? 'graded' : isLate ? 'late' : 'submitted',
      is_official: true,
      submission_source: 'offline_teacher'
    };

    store.submissions.push(newSub);

    const recIdx = store.assignmentRecipients.findIndex(
      (r) => r.assignment_id === assignmentId && r.student_id === studentId
    );
    if (recIdx >= 0) {
      store.assignmentRecipients[recIdx] = {
        ...store.assignmentRecipients[recIdx],
        status: isGradedFinal ? 'graded' : 'submitted'
      };
    } else {
      store.assignmentRecipients.push({
        id: 'rec-' + assignmentId + '-' + studentId,
        assignment_id: assignmentId,
        student_id: studentId,
        due_override_at: null,
        assigned_at: assignment.created_at,
        status: isGradedFinal ? 'graded' : 'submitted',
        extra_attempts: 0,
        reminder_count: 0,
        last_reminded_at: null
      });
    }

    assignment.version = (assignment.version || 1) + 1;
    assignment.updated_at = nowIso;
    const stats = syncAssignmentDenormalizedCounts(assignment);

    appendEvent(assignmentId, actor, 'direct_submit', {
      student_id: student.id,
      student_name: student.full_name,
      score: newSub.score ?? null,
      grade_status: desiredGradeStatus,
      note
    });
    store.logAudit(
      'DIRECT_RECORD_SUBMISSION',
      'submissions',
      newSub.id,
      `Ghi nhận nộp trực tiếp cho ${student.full_name}${newSub.score !== undefined ? ` (${newSub.score}đ)` : ''}: ${note}`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return { submission: newSub, stats };
  },

  // 12. POST /grades/:id/revise (MOD-03, FLOW-03, TC-04)
  async reviseGrade(
    actor: ActorContext,
    submissionId: string,
    payload: {
      new_score: number;
      feedback?: string;
      reason: string;
      version: number;
    }
  ): Promise<{ submission: Submission; revision: GradeRevision; stats: AssignmentComputedStats; notifiedStudent: boolean }> {
    const idx = store.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) {
      throw new ServiceError(404, 'SUBMISSION_NOT_FOUND', 'Không tìm thấy bản ghi điểm/bài nộp.');
    }
    const existing = store.submissions[idx];
    const assignment = store.assignments.find((a) => a.id === existing.assignment_id);
    assertCanAccessAssignment(actor, assignment);

    if ((existing.version || 1) !== payload.version) {
      throw new ServiceError(
        409,
        'VERSION_CONFLICT',
        'Dữ liệu điểm đã thay đổi bởi người dùng hoặc tab khác. Hệ thống yêu cầu tải lại trước khi sửa.'
      );
    }

    const currentStatus = deriveSubmissionGradeStatus(existing);
    if (currentStatus !== 'graded' && currentStatus !== 'published') {
      throw new ServiceError(422, 'NOT_GRADED_YET', 'Bài nộp chưa được chấm hoàn tất, hãy dùng chức năng Chấm bài.');
    }

    const maxScore = assignment.points_max || 10;
    const step = assignment.score_step || 0.25;
    if (typeof payload.new_score !== 'number' || isNaN(payload.new_score) || payload.new_score < 0 || payload.new_score > maxScore) {
      throw new ServiceError(400, 'INVALID_SCORE', `Điểm mới phải nằm trong khoảng 0 đến ${maxScore}.`);
    }
    const stepRatio = Math.round((payload.new_score / step) * 1000) / 1000;
    if (Math.abs(stepRatio - Math.round(stepRatio)) > 0.001) {
      throw new ServiceError(400, 'INVALID_SCORE_STEP', `Điểm mới phải chia hết cho bước điểm ${step}.`);
    }

    const reason = (payload.reason || '').trim();
    if (reason.length < 5) {
      throw new ServiceError(400, 'INVALID_REASON', 'Vui lòng nhập lý do sửa điểm (tối thiểu 5 ký tự).');
    }

    const nowIso = new Date().toISOString();
    const roundedNewScore = Math.round(payload.new_score * 100) / 100;
    const oldScore = existing.score ?? null;

    const revision: GradeRevision = {
      id: 'grev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      grade_id: existing.id,
      submission_id: existing.id,
      assignment_id: assignment.id,
      student_id: existing.student_id,
      old_score: oldScore,
      new_score: roundedNewScore,
      reason,
      changed_by: actor.fullName,
      changed_by_id: actor.userId,
      changed_at: nowIso
    };
    store.gradeRevisions.unshift(revision);

    store.submissions[idx] = {
      ...existing,
      score: roundedNewScore,
      feedback: payload.feedback !== undefined ? payload.feedback.trim() : existing.feedback,
      graded_by: actor.fullName,
      graded_at: nowIso,
      version: (existing.version || 1) + 1
    };

    const notifiedStudent = currentStatus === 'published';
    if (notifiedStudent) {
      store.notificationDeliveries.unshift({
        id: 'ndel-' + Date.now(),
        job_id: 'njob-revise-' + Date.now(),
        assignment_id: assignment.id,
        recipient_id: existing.student_id,
        recipient_name: existing.student_name,
        channel: 'system',
        status: 'sent',
        sent_at: nowIso
      });
    }

    const stats = syncAssignmentDenormalizedCounts(assignment);
    assignment.updated_at = nowIso;
    appendEvent(assignment.id, actor, 'revise_grade', {
      submission_id: existing.id,
      student_id: existing.student_id,
      student_name: existing.student_name,
      old_score: oldScore,
      new_score: roundedNewScore,
      reason
    });
    store.logAudit(
      'REVISE_GRADE',
      'grade_revisions',
      revision.id,
      `Sửa điểm ${existing.student_name}: ${oldScore ?? 'Chưa có'} → ${roundedNewScore} (${reason})`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return {
      submission: store.submissions[idx],
      revision,
      stats,
      notifiedStudent
    };
  },

  // 13. POST /assignments/:id/publish (MOD-04, ACT-14, TC-05)
  async publishGrades(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      submission_ids: string[];
      notify: boolean;
    }
  ): Promise<{ publishedIds: string[]; skippedIds: string[]; stats: AssignmentComputedStats }> {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, assignment);

    if (!payload.submission_ids || payload.submission_ids.length === 0) {
      throw new ServiceError(400, 'EMPTY_SELECTION', 'Vui lòng chọn ít nhất một bài đã chấm để công bố.');
    }

    const nowIso = new Date().toISOString();
    const publishedIds: string[] = [];
    const skippedIds: string[] = [];

    payload.submission_ids.forEach((sid) => {
      const idx = store.submissions.findIndex((s) => s.id === sid && s.assignment_id === assignmentId);
      if (idx === -1) {
        skippedIds.push(sid);
        return;
      }
      const sub = store.submissions[idx];
      const status = deriveSubmissionGradeStatus(sub);
      if (status !== 'graded' && status !== 'published') {
        skippedIds.push(sid);
        return;
      }
      if (status === 'published') {
        // Already published - count as idempotent skip unless explicit republish needed
        publishedIds.push(sid);
        return;
      }
      store.submissions[idx] = {
        ...sub,
        grade_status: 'published',
        published_at: nowIso,
        version: (sub.version || 1) + 1
      };
      publishedIds.push(sid);

      if (payload.notify) {
        store.notificationDeliveries.unshift({
          id: 'ndel-' + Math.random().toString(36).slice(2, 9),
          job_id: 'njob-pub-' + Date.now(),
          assignment_id: assignmentId,
          recipient_id: sub.student_id,
          recipient_name: sub.student_name,
          channel: 'system',
          status: 'sent',
          sent_at: nowIso
        });
      }
    });

    if (publishedIds.length === 0) {
      throw new ServiceError(
        422,
        'NO_ELIGIBLE_SUBMISSIONS',
        'Không có bài nộp nào đã chấm hoàn tất để công bố điểm.'
      );
    }

    appendEvent(assignmentId, actor, 'publish', {
      publishedCount: publishedIds.length,
      notify: payload.notify
    });
    store.logAudit(
      'PUBLISH_GRADES',
      'assignments',
      assignmentId,
      `Công bố điểm & nhận xét cho ${publishedIds.length} bài nộp`,
      actor.fullName,
      actor.role
    );
    store.notify();
    return { publishedIds, skippedIds, stats: computeAssignmentStats(assignment) };
  },

  // ACT-16 / MOD-08 Request resubmit
  async requestResubmit(
    actor: ActorContext,
    assignmentId: string,
    payload: {
      student_ids: string[];
      extra_attempts: number;
      new_due_at?: string;
      reason: string;
      version: number;
    }
  ): Promise<{ updatedStudentIds: string[]; failedStudents: Array<{ studentId: string; reason: string }> }> {
    const idx = store.assignments.findIndex((a) => a.id === assignmentId);
    const assignment = idx >= 0 ? store.assignments[idx] : undefined;
    assertCanAccessAssignment(actor, assignment);

    if ((assignment.version || 1) !== payload.version) {
      throw new ServiceError(409, 'VERSION_CONFLICT', 'Dữ liệu bài tập đã thay đổi, vui lòng tải lại.');
    }
    const reason = (payload.reason || '').trim();
    if (reason.length < 5) {
      throw new ServiceError(400, 'INVALID_REASON', 'Vui lòng nhập nhận xét/lý do yêu cầu làm lại.');
    }
    if (payload.extra_attempts < 1 || payload.extra_attempts > 5) {
      throw new ServiceError(400, 'INVALID_ATTEMPTS', 'Số lượt nộp bổ sung phải từ 1 đến 5 lượt.');
    }

    const nowIso = new Date().toISOString();
    const snapshotIds = new Set(resolveSnapshotStudents(assignment).map((s) => s.id));
    const maxCap = (assignment.max_attempts || 3) + 5;
    const updatedStudentIds: string[] = [];
    const failedStudents: Array<{ studentId: string; reason: string }> = [];

    payload.student_ids.forEach((studentId) => {
      if (!snapshotIds.has(studentId)) {
        failedStudents.push({ studentId, reason: 'Học sinh không thuộc danh sách giao bài' });
        return;
      }
      const attemptsCount = store.submissions.filter(
        (s) => s.assignment_id === assignmentId && s.student_id === studentId
      ).length;
      const recIdx = store.assignmentRecipients.findIndex(
        (r) => r.assignment_id === assignmentId && r.student_id === studentId
      );
      const currentExtra = recIdx >= 0 ? store.assignmentRecipients[recIdx].extra_attempts || 0 : 0;
      const proposedTotal = (assignment.max_attempts || 3) + currentExtra + payload.extra_attempts;
      if (proposedTotal > maxCap || attemptsCount >= maxCap) {
        failedStudents.push({ studentId, reason: `Vượt quá giới hạn tối đa ${maxCap} lượt nộp` });
        return;
      }

      if (recIdx >= 0) {
        store.assignmentRecipients[recIdx] = {
          ...store.assignmentRecipients[recIdx],
          extra_attempts: currentExtra + payload.extra_attempts,
          due_override_at: payload.new_due_at ? new Date(payload.new_due_at).toISOString() : store.assignmentRecipients[recIdx].due_override_at
        };
      } else {
        store.assignmentRecipients.push({
          id: 'rec-' + assignmentId + '-' + studentId,
          assignment_id: assignmentId,
          student_id: studentId,
          due_override_at: payload.new_due_at ? new Date(payload.new_due_at).toISOString() : null,
          assigned_at: assignment.created_at,
          status: 'submitted',
          extra_attempts: payload.extra_attempts,
          reminder_count: 0,
          last_reminded_at: null
        });
      }

      // Mark official submission as returned / resubmit requested
      const studentSubs = store.submissions.filter(
        (s) => s.assignment_id === assignmentId && s.student_id === studentId
      );
      studentSubs.forEach((sub) => {
        sub.resubmit_requested = true;
        sub.resubmit_reason = reason;
        sub.resubmit_due_at = payload.new_due_at ? new Date(payload.new_due_at).toISOString() : undefined;
      });

      updatedStudentIds.push(studentId);
    });

    if (updatedStudentIds.length > 0) {
      store.assignments[idx] = {
        ...assignment,
        receive_status: assignment.receive_status === 'closed' ? 'open' : assignment.receive_status,
        status: assignment.status === 'closed' ? 'published' : assignment.status,
        version: (assignment.version || 1) + 1,
        updated_at: nowIso
      };
      appendEvent(assignmentId, actor, 'request_resubmit', {
        student_ids: updatedStudentIds,
        extra_attempts: payload.extra_attempts,
        reason
      });
      store.logAudit(
        'REQUEST_RESUBMIT',
        'assignments',
        assignmentId,
        `Yêu cầu ${updatedStudentIds.length} học sinh làm lại (+${payload.extra_attempts} lượt): ${reason}`,
        actor.fullName,
        actor.role
      );
      store.notify();
    }

    return { updatedStudentIds, failedStudents };
  },

  // 14. POST /assignments/:id/export (MOD-09, FLOW-07, TC-10)
  async exportAssignmentsReport(
    actor: ActorContext,
    payload: {
      assignmentId?: string; // If omitted, exports summary across filtered/selected assignments
      selectedAssignmentIds?: string[];
      filters?: AssignmentQueryFilters;
      scope: 'current_assignment_students' | 'filtered_assignments' | 'selected_assignments';
      format: 'csv' | 'json';
      columns: string[];
    }
  ): Promise<{
    filename: string;
    mimeType: string;
    content: string;
    rowCount: number;
  }> {
    assertAuthenticated(actor);
    if (actor.role === 'student' || actor.role === 'parent') {
      throw new ServiceError(403, 'FORBIDDEN', 'Không có quyền xuất báo cáo.');
    }

    const nowStamp = new Date().toISOString().slice(0, 10);

    if (payload.scope === 'current_assignment_students' && payload.assignmentId) {
      const assignment = store.assignments.find((a) => a.id === payload.assignmentId);
      assertCanAccessAssignment(actor, assignment);
      const rows = buildRecipientRows(assignment).slice(0, BUSINESS_POLICY_DEFAULTS.maxExportRows);

      const selectedCols =
        payload.columns && payload.columns.length > 0
          ? payload.columns
          : ['student_code', 'full_name', 'status', 'submitted_at', 'attempt_no', 'score', 'grade_status', 'feedback'];

      const headerLabels: Record<string, string> = {
        student_code: 'Mã HS',
        full_name: 'Họ và tên',
        status: 'Trạng thái nộp',
        submitted_at: 'Thời gian nộp',
        attempt_no: 'Lượt nộp',
        score: 'Điểm',
        grade_status: 'Trạng thái chấm',
        feedback: 'Nhận xét'
      };

      const mapped = rows.map((r) => ({
        student_code: r.student.student_code,
        full_name: r.student.full_name,
        status: r.isSubmitted ? (r.isLate ? 'Nộp muộn' : 'Đã nộp') : 'Chưa nộp',
        submitted_at: r.officialSubmission
          ? new Date(r.officialSubmission.submitted_at).toLocaleString('vi-VN')
          : '—',
        attempt_no: r.attemptCount,
        score: r.effectiveScore !== null ? r.effectiveScore : '—',
        grade_status:
          !r.isSubmitted
            ? 'Chưa chấm'
            : r.gradeStatus === 'published'
            ? 'Đã chấm · Đã trả'
            : r.gradeStatus === 'graded'
            ? 'Đã chấm (Chưa trả)'
            : r.gradeStatus === 'draft_grade'
            ? 'Chấm nháp'
            : 'Chưa chấm',
        feedback: r.officialSubmission?.feedback || ''
      }));

      appendEvent(assignment.id, actor, 'export', {
        format: payload.format,
        scope: payload.scope,
        rowCount: mapped.length
      });
      store.logAudit(
        'EXPORT_ASSIGNMENT_REPORT',
        'assignments',
        assignment.id,
        `Xuất báo cáo chi tiết bài "${assignment.title}" (${mapped.length} dòng, ${payload.format.toUpperCase()})`,
        actor.fullName,
        actor.role
      );

      if (payload.format === 'json') {
        return {
          filename: `bao-cao-${assignment.code || assignment.id}-${nowStamp}.json`,
          mimeType: 'application/json;charset=utf-8;',
          content: JSON.stringify({ assignment: assignment.title, exportedAt: new Date().toISOString(), rows: mapped }, null, 2),
          rowCount: mapped.length
        };
      }

      const headerLine = selectedCols.map((c) => sanitizeCsvCell(headerLabels[c] || c)).join(',');
      const dataLines = mapped.map((row) =>
        selectedCols.map((c) => sanitizeCsvCell((row as Record<string, unknown>)[c])).join(',')
      );
      const csv = '\uFEFF' + [headerLine, ...dataLines].join('\n');
      return {
        filename: `bao-cao-${assignment.code || assignment.id}-${nowStamp}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
        content: csv,
        rowCount: mapped.length
      };
    }

    // Export list of assignments scoped strictly to actor permissions & active filter (TC-10)
    const listed = await this.listAssignments(actor, { ...(payload.filters || {}), page: 1, pageSize: BUSINESS_POLICY_DEFAULTS.maxExportRows });
    let targetItems = listed.items;

    if (payload.scope === 'selected_assignments' && payload.selectedAssignmentIds) {
      const selSet = new Set(payload.selectedAssignmentIds);
      targetItems = targetItems.filter((item) => selSet.has(item.assignment.id));
    }

    const mappedList = targetItems.map(({ assignment, stats }) => ({
      code: assignment.code || assignment.id,
      title: assignment.title,
      class_name: assignment.class_name,
      subject_name: assignment.subject_name,
      due_date: new Date(assignment.due_date).toLocaleString('vi-VN'),
      receive_status: formatReceiveStatusLabel(assignment, stats),
      submitted_count: `${stats.submittedCount}/${stats.totalStudents}`,
      graded_count: `${stats.gradedCount}/${stats.submittedCount}`,
      pending_grade: stats.pendingGradeCount,
      average_score: stats.averageScore !== null ? stats.averageScore : '—'
    }));

    store.logAudit(
      'EXPORT_ASSIGNMENTS_LIST',
      'assignments',
      'list',
      `Xuất danh sách ${mappedList.length} bài tập đã giao (${payload.format.toUpperCase()})`,
      actor.fullName,
      actor.role
    );

    if (payload.format === 'json') {
      return {
        filename: `danh-sach-bai-tap-${nowStamp}.json`,
        mimeType: 'application/json;charset=utf-8;',
        content: JSON.stringify({ exportedAt: new Date().toISOString(), rows: mappedList }, null, 2),
        rowCount: mappedList.length
      };
    }

    const cols = ['code', 'title', 'class_name', 'subject_name', 'due_date', 'receive_status', 'submitted_count', 'graded_count', 'pending_grade', 'average_score'];
    const labels: Record<string, string> = {
      code: 'Mã bài',
      title: 'Tên bài tập',
      class_name: 'Lớp',
      subject_name: 'Môn học',
      due_date: 'Hạn nộp',
      receive_status: 'Trạng thái nhận bài',
      submitted_count: 'Đã nộp/Tổng',
      graded_count: 'Đã chấm/Đã nộp',
      pending_grade: 'Chờ chấm',
      average_score: 'Điểm TB'
    };

    const headerLine = cols.map((c) => sanitizeCsvCell(labels[c])).join(',');
    const dataLines = mappedList.map((row) =>
      cols.map((c) => sanitizeCsvCell((row as Record<string, unknown>)[c])).join(',')
    );
    return {
      filename: `danh-sach-bai-tap-${nowStamp}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      content: '\uFEFF' + [headerLine, ...dataLines].join('\n'),
      rowCount: mappedList.length
    };
  },

  // Get recent notification deliveries for an assignment or student
  getAssignmentNotificationDeliveries(actor: ActorContext, assignmentId: string): NotificationDelivery[] {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    assertCanAccessAssignment(actor, assignment);
    return store.notificationDeliveries.filter((d) => d.assignment_id === assignmentId);
  }
};
