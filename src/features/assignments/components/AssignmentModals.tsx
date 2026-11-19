import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  FileWarning,
  History,
  Lock,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Unlock,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import {
  ActorContext,
  AssignmentManagementService,
  AssignmentQueryFilters,
  ServiceError
} from '../../../services/assignmentManagementService';
import { aiAssistant } from '../../../services/aiService';
import {
  Assignment,
  ClassModel,
  GradeRevision,
  NotificationChannel,
  NotificationDelivery,
  Student,
  Submission
} from '../../../types';
import {
  downloadSubmissionAttachment,
  downloadTextFile,
  formatDateTimeVN,
  getGradeStatusMeta,
  toDatetimeLocalValue
} from '../utils/formatters';

interface DarkModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
}

const DarkModalShell: React.FC<DarkModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'lg',
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWClass =
    maxWidth === 'md'
      ? 'max-w-md'
      : maxWidth === 'lg'
      ? 'max-w-lg'
      : maxWidth === 'xl'
      ? 'max-w-xl'
      : maxWidth === '2xl'
      ? 'max-w-2xl'
      : 'max-w-4xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWClass} bg-[#031C2E] border border-[#064966] rounded-[14px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#064966] bg-[#021727] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-slate-300 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#064966]/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// MOD-01: GIA HẠN NỘP BÀI (LỚP / CÁ NHÂN)
// ==========================================
interface ExtendDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  recipientIds?: string[];
  recipientNames?: string[];
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  recipientIds,
  recipientNames,
  onSuccess,
  onError
}) => {
  const isIndividual = Boolean(recipientIds && recipientIds.length > 0);
  const [newDueAt, setNewDueAt] = useState<string>(() =>
    toDatetimeLocalValue(new Date(Math.max(Date.now(), new Date(assignment.due_date).getTime()) + 2 * 86400000).toISOString())
  );
  const [reason, setReason] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewDueAt(
        toDatetimeLocalValue(
          new Date(Math.max(Date.now(), new Date(assignment.due_date).getTime()) + 2 * 86400000).toISOString()
        )
      );
      setReason('');
      setLocalError(null);
    }
  }, [isOpen, assignment.due_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!newDueAt || new Date(newDueAt).getTime() <= Date.now()) {
      setLocalError('Thời hạn mới phải sau thời điểm hiện tại.');
      return;
    }
    if (reason.trim().length < 10 || reason.trim().length > 500) {
      setLocalError('Lý do gia hạn bắt buộc từ 10 đến 500 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.extendDeadline(actor, assignment.id, {
        recipient_ids: isIndividual ? recipientIds : undefined,
        new_due_at: new Date(newDueAt).toISOString(),
        reason: reason.trim(),
        version: assignment.version || 1
      });
      onClose();
      onSuccess(
        isIndividual
          ? `Đã gia hạn riêng cho ${res.updatedStudentIds.length} học sinh đến ${formatDateTimeVN(
              new Date(newDueAt).toISOString()
            )}. Hạn của các học sinh khác giữ nguyên.`
          : `Đã gia hạn toàn lớp đến ${formatDateTimeVN(new Date(newDueAt).toISOString())}.`
      );
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isIndividual ? 'Gia hạn riêng cho học sinh' : 'Gia hạn hạn nộp toàn lớp'}
      subtitle={assignment.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-[#00121F] border border-[#064966]/80 space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Phạm vi áp dụng:</span>
            <span className="font-semibold text-[#00D4FF]">
              {isIndividual ? `${recipientIds?.length} học sinh được chọn` : `Toàn bộ lớp ${assignment.class_name}`}
            </span>
          </div>
          {isIndividual && recipientNames && recipientNames.length > 0 && (
            <p className="text-[11px] text-slate-300">Học sinh: {recipientNames.join(', ')}</p>
          )}
          <div className="flex items-center justify-between text-slate-300">
            <span>Hạn mặc định hiện tại:</span>
            <span className="tabular-nums font-medium">{formatDateTimeVN(assignment.due_date)}</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Thời hạn nộp mới <span className="text-rose-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={newDueAt}
            onChange={(e) => setNewDueAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Lý do gia hạn (10 – 500 ký tự) <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Học sinh xin phép nghỉ ốm có xác nhận của phụ huynh / Điều chỉnh lịch học tuần này..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
          <span className="text-[11px] text-slate-400 mt-1 block">{reason.trim().length}/500 ký tự</span>
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang lưu...' : 'Xác nhận gia hạn'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-02: NHẮC NỘP BÀI (CHỐNG TRÙNG + RETRY)
// ==========================================
interface RemindModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  recipientIds: string[];
  recipientNames: string[];
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const RemindModal: React.FC<RemindModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  recipientIds,
  recipientNames,
  onSuccess,
  onError
}) => {
  const [channel, setChannel] = useState<NotificationChannel>('system');
  const [message, setMessage] = useState<string>('');
  const [deliveries, setDeliveries] = useState<NotificationDelivery[] | null>(null);
  const [resultSummary, setResultSummary] = useState<{ sent: number; skipped: number; failed: number } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChannel('system');
      setMessage(
        `Nhắc nhở: Em vui lòng hoàn thành và nộp bài "${assignment.title}" trước hạn ${formatDateTimeVN(
          assignment.due_date
        )}.`
      );
      setDeliveries(null);
      setResultSummary(null);
      setLocalError(null);
    }
  }, [isOpen, assignment.title, assignment.due_date]);

  const executeSend = async (targetIds: string[]) => {
    setLocalError(null);
    if (!message.trim() || message.trim().length > 1000) {
      setLocalError('Nội dung nhắc nộp phải từ 1 đến 1000 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.sendReminder(actor, assignment.id, {
        recipient_ids: targetIds,
        channel,
        message: message.trim()
      });
      setDeliveries(res.deliveries);
      setResultSummary({
        sent: res.sentCount,
        skipped: res.skippedDuplicateCount,
        failed: res.failedCount
      });
      if (res.sentCount > 0) {
        onSuccess(
          res.failedCount === 0 && res.skippedDuplicateCount === 0
            ? `Đã gửi nhắc nộp bài tới ${res.sentCount} học sinh thành công.`
            : `Đã gửi nhắc tới ${res.sentCount} học sinh (Bỏ qua trùng: ${res.skippedDuplicateCount}, Lỗi: ${res.failedCount}).`
        );
      }
    } catch (err) {
      if (err instanceof ServiceError && (err.status === 400 || err.status === 422)) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const failedIds = (deliveries || []).filter((d) => d.status === 'failed').map((d) => d.recipient_id);

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Nhắc học sinh chưa nộp bài"
      subtitle={`${assignment.title} · ${recipientIds.length} học sinh được chọn`}
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-[#00121F] border border-[#064966]/80 space-y-1">
          <div className="flex justify-between text-slate-300">
            <span>Số người nhận:</span>
            <strong className="text-[#00D4FF]">{recipientIds.length} học sinh</strong>
          </div>
          {recipientNames.length > 0 && (
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {recipientNames.slice(0, 6).join(', ')}
              {recipientNames.length > 6 ? ` (+${recipientNames.length - 6} em)` : ''}
            </p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">Kênh gửi nhắc nhở</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'system', label: 'Thông báo Hệ thống' },
                { id: 'parent_app', label: 'App Phụ huynh' },
                { id: 'email', label: 'Email HS / PH' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setChannel(opt.id)}
                className={`px-2.5 py-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                  channel === opt.id
                    ? 'bg-[#009ED0]/20 border-[#009ED0] text-[#00D4FF]'
                    : 'bg-[#00121F] border-[#064966] text-slate-300 hover:border-[#009ED0]/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Chống gửi trùng: cùng kênh và cùng học sinh trong 60 phút sẽ tự động bỏ qua.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Nội dung nhắc nhở (tối đa 1000 ký tự) <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">{message.trim().length}/1000 ký tự</span>
        </div>

        {resultSummary && deliveries && (
          <div className="p-3 rounded-xl bg-[#00121F] border border-[#064966] space-y-2">
            <div className="flex flex-wrap gap-3 font-semibold">
              <span className="text-emerald-300">Gửi thành công: {resultSummary.sent}</span>
              <span className="text-amber-300">Bỏ qua do trùng 60p: {resultSummary.skipped}</span>
              <span className="text-rose-300">Thất bại: {resultSummary.failed}</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-[#064966]/40 last:border-none"
                >
                  <span className="text-slate-200 truncate">{d.recipient_name || d.recipient_id}</span>
                  <span
                    className={
                      d.status === 'sent'
                        ? 'text-emerald-300'
                        : d.status === 'skipped_duplicate'
                        ? 'text-amber-300'
                        : 'text-rose-300'
                    }
                  >
                    {d.status === 'sent'
                      ? 'Đã gửi'
                      : d.status === 'skipped_duplicate'
                      ? 'Bỏ qua (trùng)'
                      : d.error || 'Lỗi'}
                  </span>
                </div>
              ))}
            </div>
            {failedIds.length > 0 && (
              <button
                type="button"
                onClick={() => executeSend(failedIds)}
                disabled={submitting}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thử gửi lại cho {failedIds.length} em lỗi</span>
              </button>
            )}
          </div>
        )}

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => executeSend(recipientIds)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang gửi...' : 'Gửi nhắc nhở'}</span>
          </button>
        </div>
      </div>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-03: SỬA ĐIỂM CÓ KIỂM SOÁT & AUDIT
// ==========================================
interface ReviseGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  submission: Submission;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const ReviseGradeModal: React.FC<ReviseGradeModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  submission,
  onSuccess,
  onError
}) => {
  const [newScore, setNewScore] = useState<string>(submission.score !== undefined ? String(submission.score) : '');
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [reason, setReason] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewScore(submission.score !== undefined ? String(submission.score) : '');
      setFeedback(submission.feedback || '');
      setReason('');
      setLocalError(null);
    }
  }, [isOpen, submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const parsed = parseFloat(newScore);
    if (isNaN(parsed)) {
      setLocalError('Vui lòng nhập điểm mới hợp lệ.');
      return;
    }
    if (reason.trim().length < 5) {
      setLocalError('Lý do sửa điểm bắt buộc tối thiểu 5 ký tự để lưu nhật ký kiểm toán.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.reviseGrade(actor, submission.id, {
        new_score: parsed,
        feedback: feedback.trim(),
        reason: reason.trim(),
        version: submission.version || 1
      });
      onClose();
      onSuccess(
        `Đã cập nhật điểm cho ${submission.student_name}: ${res.revision.old_score ?? '—'} → ${
          res.revision.new_score
        }đ.${res.notifiedStudent ? ' Đã gửi thông báo điểm mới tới học sinh.' : ''}`
      );
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Sửa điểm: ${submission.student_name}`}
      subtitle={`${assignment.title} · Điểm hiện tại: ${submission.score ?? '—'}/${assignment.points_max}đ`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {submission.grade_status === 'published' && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Điểm của bài này đã được công bố cho học sinh và phụ huynh. Khi sửa điểm, hệ thống sẽ ghi nhận
              GradeRevision bất biến và tự động gửi thông báo cập nhật.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#00121F] border border-[#064966]/70">
            <span className="text-slate-400 block">Điểm cũ</span>
            <strong className="text-lg font-mono text-slate-200">
              {submission.score !== undefined ? `${submission.score} / ${assignment.points_max}` : '—'}
            </strong>
          </div>
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Điểm mới (bước {assignment.score_step || 0.25}đ) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step={assignment.score_step || 0.25}
              min={0}
              max={assignment.points_max || 10}
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-base font-mono font-bold text-[#00D4FF] focus:border-[#009ED0] focus:outline-hidden"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1">Nhận xét cập nhật</label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1">
            Lý do sửa điểm (bắt buộc lưu audit) <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Cộng bổ sung 0.5đ phần tự luận câu 2 sau phúc khảo..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Đang lưu...' : 'Lưu sửa điểm'}
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-04: CÔNG BỐ ĐIỂM / TRẢ BÀI
// ==========================================
interface PublishGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  submissionIds: string[];
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const PublishGradesModal: React.FC<PublishGradesModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  submissionIds,
  onSuccess,
  onError
}) => {
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.publishGrades(actor, assignment.id, {
        submission_ids: submissionIds,
        notify
      });
      onClose();
      onSuccess(
        `Đã công bố điểm & nhận xét cho ${res.publishedIds.length} bài nộp.${
          res.skippedIds.length > 0 ? ` (Bỏ qua ${res.skippedIds.length} bài chưa đủ điều kiện.)` : ''
        }`
      );
    } catch (err) {
      onError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Trả bài & Công bố điểm cho học sinh"
      subtitle={assignment.title}
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-xl bg-[#00121F] border border-[#064966] space-y-1.5">
          <p className="text-slate-200">
            Bạn chuẩn bị công bố điểm và nhận xét cho{' '}
            <strong className="text-[#00D4FF]">{submissionIds.length} bài nộp</strong> đã chấm hoàn tất.
          </p>
          <p className="text-slate-400">
            Sau khi công bố, học sinh và phụ huynh có thể xem điểm chính thức trên cổng cá nhân. Mọi chỉnh sửa
            sau đó sẽ yêu cầu lý do kiểm toán (Sửa điểm).
          </p>
        </div>

        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="w-4 h-4 accent-[#009ED0] rounded"
          />
          <span>Gửi thông báo điểm mới ngay tới Học sinh & Phụ huynh</span>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || submissionIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang công bố...' : 'Xác nhận trả bài'}</span>
          </button>
        </div>
      </div>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-05: ĐÓNG / MỞ LẠI NHẬN BÀI
// ==========================================
interface CloseReopenModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'close' | 'reopen';
  actor: ActorContext;
  assignment: Assignment;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const CloseReopenModal: React.FC<CloseReopenModalProps> = ({
  isOpen,
  onClose,
  mode,
  actor,
  assignment,
  onSuccess,
  onError
}) => {
  const [reason, setReason] = useState('');
  const [newDueAt, setNewDueAt] = useState(() =>
    toDatetimeLocalValue(new Date(Date.now() + 3 * 86400000).toISOString())
  );
  const [updateDueOnReopen, setUpdateDueOnReopen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const duePassed = new Date(assignment.due_date).getTime() <= Date.now();
      setReason('');
      setUpdateDueOnReopen(mode === 'reopen' && duePassed);
      setNewDueAt(toDatetimeLocalValue(new Date(Date.now() + 3 * 86400000).toISOString()));
      setLocalError(null);
    }
  }, [isOpen, mode, assignment.due_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (reason.trim().length < 5) {
      setLocalError('Vui lòng nhập lý do tối thiểu 5 ký tự.');
      return;
    }
    if (mode === 'reopen' && updateDueOnReopen) {
      const nextDueMs = new Date(newDueAt).getTime();
      if (!newDueAt || isNaN(nextDueMs) || nextDueMs <= Date.now()) {
        setLocalError('Thời hạn mới khi mở lại phải sau thời điểm hiện tại.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'close') {
        await AssignmentManagementService.closeAssignment(actor, assignment.id, {
          reason: reason.trim(),
          version: assignment.version || 1
        });
        onClose();
        onSuccess(`Đã đóng nhận bài "${assignment.title}". Học sinh không thể nộp mới hay nộp bổ sung.`);
      } else {
        await AssignmentManagementService.reopenAssignment(actor, assignment.id, {
          reason: reason.trim(),
          new_due_at: updateDueOnReopen && newDueAt ? new Date(newDueAt).toISOString() : undefined,
          version: assignment.version || 1
        });
        onClose();
        onSuccess(`Đã mở lại nhận bài "${assignment.title}".`);
      }
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'close' ? 'Đóng nhận bài tập' : 'Mở lại nhận bài tập'}
      subtitle={assignment.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div
          className={`p-3 rounded-xl border ${
            mode === 'close'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {mode === 'close'
            ? 'Khi đóng nhận bài, học sinh chưa nộp hoặc đang làm dở sẽ bị khóa chức năng nộp mới (kể cả khi chưa hết hạn cũ). Bài đã nộp và điểm chấm vẫn giữ nguyên.'
            : 'Mở lại nhận bài cho phép học sinh tiếp tục nộp bài (hoặc nộp bổ sung nếu còn lượt).'}
        </div>

        {mode === 'reopen' && (
          <div className="space-y-2 p-3 rounded-xl bg-[#00121F] border border-[#064966]/70">
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateDueOnReopen}
                onChange={(e) => setUpdateDueOnReopen(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#009ED0] rounded"
              />
              <span>Cập nhật hạn nộp mới khi mở lại</span>
            </label>
            {updateDueOnReopen && (
              <input
                type="datetime-local"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#031C2E] border border-[#064966] text-slate-100"
              />
            )}
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Lý do {mode === 'close' ? 'đóng nhận bài' : 'mở lại nhận bài'} <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              mode === 'close'
                ? 'Ví dụ: Đã chốt sổ điểm tuần / Chuyển sang chữa bài trực tiếp trên lớp...'
                : 'Ví dụ: Mở lại cho các em bổ sung file bị thiếu...'
            }
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-white cursor-pointer disabled:opacity-50 ${
              mode === 'close' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {mode === 'close' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{submitting ? 'Đang xử lý...' : mode === 'close' ? 'Đóng nhận bài' : 'Mở lại nhận bài'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-06: THU HỒI BÀI TẬP (SOFT WITHDRAW)
// ==========================================
interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  onSuccess,
  onError
}) => {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setConfirmation('');
      setLocalError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (reason.trim().length < 5) {
      setLocalError('Vui lòng nhập lý do thu hồi tối thiểu 5 ký tự.');
      return;
    }
    if (!confirmation.trim()) {
      setLocalError('Vui lòng nhập "XÁC NHẬN" hoặc tên bài tập để tiếp tục.');
      return;
    }
    setSubmitting(true);
    try {
      await AssignmentManagementService.withdrawAssignment(actor, assignment.id, {
        reason: reason.trim(),
        confirmation: confirmation.trim(),
        version: assignment.version || 1
      });
      onClose();
      onSuccess(
        `Đã thu hồi mềm bài tập "${assignment.title}". Toàn bộ dữ liệu bài nộp và điểm cũ vẫn được lưu trữ trong nhật ký.`
      );
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Thu hồi bài tập đã giao"
      subtitle={assignment.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 space-y-1">
          <p className="font-semibold">Lưu ý chính sách thu hồi mềm (Soft-Withdraw):</p>
          <p>
            Bài tập sẽ ẩn khỏi danh sách cần làm của học sinh ngay lập tức. Toàn bộ bài nộp, điểm đã chấm và
            lịch sử sự kiện vẫn được giữ nguyên trong cơ sở dữ liệu phục vụ tra cứu/kiểm toán.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Lý do thu hồi (tối thiểu 5 ký tự) <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Giao nhầm đề lớp / Thay thế bằng bộ đề cập nhật mới..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Gõ chữ <span className="text-[#00D4FF] font-mono">XÁC NHẬN</span> hoặc nhập đúng tên bài tập{' '}
            <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="XÁC NHẬN"
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-rose-400 focus:outline-hidden"
            required
          />
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang thu hồi...' : 'Thu hồi bài tập'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-07: SAO CHÉP / GIAO LẠI SANG LỚP KHÁC
// ==========================================
interface DuplicateReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'copy' | 'reassign';
  actor: ActorContext;
  assignment: Assignment;
  authorizedClasses: ClassModel[];
  onSuccess: (message: string, createdIds: string[]) => void;
  onError: (err: unknown) => void;
}

export const DuplicateReassignModal: React.FC<DuplicateReassignModalProps> = ({
  isOpen,
  onClose,
  mode,
  actor,
  assignment,
  authorizedClasses,
  onSuccess,
  onError
}) => {
  const [title, setTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState(() =>
    toDatetimeLocalValue(new Date(Date.now() + 7 * 86400000).toISOString())
  );
  const [allowLate, setAllowLate] = useState(assignment.allow_late);
  const [maxAttempts, setMaxAttempts] = useState<number>(assignment.max_attempts || 3);
  const [preventDuplicate, setPreventDuplicate] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(mode === 'copy' ? `[Bản sao] ${assignment.title}` : assignment.title);
      const otherClass = authorizedClasses.find((c) => c.id !== assignment.class_id);
      setSelectedClassIds(otherClass ? [otherClass.id] : [assignment.class_id]);
      setDueAt(toDatetimeLocalValue(new Date(Date.now() + 7 * 86400000).toISOString()));
      setAllowLate(assignment.allow_late);
      setMaxAttempts(assignment.max_attempts || 3);
      setPreventDuplicate(true);
      setLocalError(null);
    }
  }, [isOpen, mode, assignment, authorizedClasses]);

  const toggleClass = (cid: string) => {
    setSelectedClassIds((prev) => (prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!title.trim()) {
      setLocalError('Vui lòng nhập tiêu đề cho lượt giao mới.');
      return;
    }
    if (selectedClassIds.length === 0) {
      setLocalError('Vui lòng chọn ít nhất một lớp đích.');
      return;
    }
    const dueMs = new Date(dueAt).getTime();
    if (!dueAt || isNaN(dueMs) || dueMs <= Date.now()) {
      setLocalError('Thời hạn nộp mới phải sau thời điểm hiện tại.');
      return;
    }
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
      setLocalError('Số lượt nộp tối đa phải từ 1 đến 10.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await AssignmentManagementService.duplicateOrReassignAssignment(actor, assignment.id, {
        mode,
        target_class_ids: selectedClassIds,
        due_at: new Date(dueAt).toISOString(),
        title: title.trim(),
        allow_late: allowLate,
        max_attempts: maxAttempts,
        prevent_duplicate_in_same_class: preventDuplicate
      });
      onClose();
      onSuccess(
        mode === 'copy'
          ? `Đã sao chép sang bản nháp mới cho ${created.length} lớp.`
          : `Đã giao lại bài tập sang ${created.map((c) => c.class_name).join(', ')} (dữ liệu nộp cũ không bị sao chép).`,
        created.map((c) => c.id)
      );
    } catch (err) {
      if (err instanceof ServiceError && (err.status === 400 || err.status === 422)) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'copy' ? 'Sao chép thành bản nháp mới' : 'Giao lại bài tập cho lớp khác'}
      subtitle={assignment.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-200 mb-1">Tiêu đề lượt giao mới</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Chọn lớp đích trong phạm vi phụ trách <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-[#00121F] border border-[#064966]/70">
            {authorizedClasses.map((cls) => (
              <label key={cls.id} className="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClassIds.includes(cls.id)}
                  onChange={() => toggleClass(cls.id)}
                  className="w-3.5 h-3.5 accent-[#009ED0] rounded"
                />
                <span className="truncate">
                  {cls.name} ({cls.student_count} HS)
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-200 mb-1">Thời hạn nộp mới *</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-200 mb-1">Số lượt nộp tối đa</label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#009ED0] rounded"
            />
            <span>Cho phép nộp muộn sau hạn (gắn nhãn nộp muộn)</span>
          </label>
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={preventDuplicate}
              onChange={(e) => setPreventDuplicate(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#009ED0] rounded"
            />
            <span>Chặn tạo trùng nếu lớp đích đã có bài tập cùng tên đang mở</span>
          </label>
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {mode === 'copy' ? <Copy className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{submitting ? 'Đang tạo...' : mode === 'copy' ? 'Tạo bản sao nháp' : 'Giao bài ngay'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-08: YÊU CẦU LÀM LẠI / NỘP LẠI
// ==========================================
interface RequestResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  studentIds: string[];
  studentNames: string[];
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const RequestResubmitModal: React.FC<RequestResubmitModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  studentIds,
  studentNames,
  onSuccess,
  onError
}) => {
  const [extraAttempts, setExtraAttempts] = useState(1);
  const [updateDue, setUpdateDue] = useState(false);
  const [newDueAt, setNewDueAt] = useState(() =>
    toDatetimeLocalValue(new Date(Date.now() + 2 * 86400000).toISOString())
  );
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExtraAttempts(1);
      setUpdateDue(false);
      setReason('');
      setLocalError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (reason.trim().length < 5) {
      setLocalError('Vui lòng nhập nhận xét/yêu cầu sửa lại tối thiểu 5 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.requestResubmit(actor, assignment.id, {
        student_ids: studentIds,
        extra_attempts: extraAttempts,
        new_due_at: updateDue && newDueAt ? new Date(newDueAt).toISOString() : undefined,
        reason: reason.trim(),
        version: assignment.version || 1
      });
      onClose();
      onSuccess(
        `Đã cấp thêm +${extraAttempts} lượt làm lại cho ${res.updatedStudentIds.length} học sinh.${
          res.failedStudents.length > 0 ? ` (${res.failedStudents.length} HS vượt trần tối đa.)` : ''
        }`
      );
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu học sinh làm lại / nộp bổ sung"
      subtitle={`${assignment.title} · ${studentIds.length} học sinh`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-[#00121F] border border-[#064966]/70">
          <span className="text-slate-400">Học sinh áp dụng:</span>
          <p className="text-slate-100 font-medium mt-0.5">{studentNames.join(', ')}</p>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1">Số lượt nộp cấp thêm (1 – 5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={extraAttempts}
            onChange={(e) => setExtraAttempts(Number(e.target.value))}
            className="w-32 px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={updateDue}
              onChange={(e) => setUpdateDue(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#009ED0] rounded"
            />
            <span>Gia hạn thêm hạn nộp riêng cho các em này</span>
          </label>
          {updateDue && (
            <input
              type="datetime-local"
              value={newDueAt}
              onChange={(e) => setNewDueAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100"
            />
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Nội dung yêu cầu sửa lại <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Ảnh bài làm bị mờ ở trang 2, vui lòng chụp lại rõ nét và nộp bổ sung..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Đang cấp lượt...' : 'Xác nhận yêu cầu làm lại'}
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// MOD-09: XUẤT BÁO CÁO (CSV / JSON)
// ==========================================
interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  currentAssignmentId: string | null;
  selectedAssignmentIds: string[];
  filters: AssignmentQueryFilters;
  defaultScope?: 'current_assignment_students' | 'filtered_assignments' | 'selected_assignments';
  onSuccess: (message: string) => void;
}

const AVAILABLE_COLUMNS = [
  { id: 'student_code', label: 'Mã học sinh' },
  { id: 'full_name', label: 'Họ và tên' },
  { id: 'status', label: 'Trạng thái nộp' },
  { id: 'submitted_at', label: 'Thời gian nộp' },
  { id: 'attempt_no', label: 'Số lượt nộp' },
  { id: 'score', label: 'Điểm số' },
  { id: 'grade_status', label: 'Trạng thái chấm' },
  { id: 'feedback', label: 'Nhận xét giáo viên' }
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  actor,
  currentAssignmentId,
  selectedAssignmentIds,
  filters,
  defaultScope,
  onSuccess
}) => {
  const [scope, setScope] = useState<'current_assignment_students' | 'filtered_assignments' | 'selected_assignments'>(
    defaultScope || (currentAssignmentId ? 'current_assignment_students' : 'filtered_assignments')
  );
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [columns, setColumns] = useState<string[]>(AVAILABLE_COLUMNS.map((c) => c.id));
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScope(defaultScope || (currentAssignmentId ? 'current_assignment_students' : 'filtered_assignments'));
      setLocalError(null);
    }
  }, [isOpen, defaultScope, currentAssignmentId]);

  const toggleCol = (colId: string) => {
    setColumns((prev) => (prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]));
  };

  const handleExport = async () => {
    setLocalError(null);
    if (scope === 'current_assignment_students' && columns.length === 0) {
      setLocalError('Vui lòng chọn ít nhất một cột dữ liệu để xuất.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await AssignmentManagementService.exportAssignmentsReport(actor, {
        assignmentId: currentAssignmentId || undefined,
        selectedAssignmentIds,
        filters,
        scope,
        format,
        columns
      });
      downloadTextFile(res.filename, res.mimeType, res.content);
      onClose();
      onSuccess(`Đã xuất tệp ${res.filename} (${res.rowCount} dòng dữ liệu).`);
    } catch (err: any) {
      setLocalError(err?.message || 'Xuất báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất báo cáo Danh sách bài tập & Điểm"
      subtitle="Dữ liệu xuất tuân thủ quyền giáo viên và được bảo vệ công thức CSV"
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">Phạm vi xuất dữ liệu</label>
          <div className="space-y-2">
            {currentAssignmentId && (
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#00121F] border border-[#064966] cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'current_assignment_students'}
                  onChange={() => setScope('current_assignment_students')}
                  className="accent-[#009ED0]"
                />
                <span>Chi tiết từng học sinh của bài tập đang xem</span>
              </label>
            )}
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#00121F] border border-[#064966] cursor-pointer">
              <input
                type="radio"
                name="exportScope"
                checked={scope === 'filtered_assignments'}
                onChange={() => setScope('filtered_assignments')}
                className="accent-[#009ED0]"
              />
              <span>Tổng hợp các bài tập theo bộ lọc hiện tại</span>
            </label>
            {selectedAssignmentIds.length > 0 && (
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#00121F] border border-[#064966] cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'selected_assignments'}
                  onChange={() => setScope('selected_assignments')}
                  className="accent-[#009ED0]"
                />
                <span>Các bài tập đã tick chọn ({selectedAssignmentIds.length} bài)</span>
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">Định dạng tệp</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`py-2 px-3 rounded-lg border font-semibold cursor-pointer ${
                format === 'csv'
                  ? 'bg-[#009ED0]/20 border-[#009ED0] text-[#00D4FF]'
                  : 'bg-[#00121F] border-[#064966] text-slate-300'
              }`}
            >
              CSV (Excel UTF-8 BOM)
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`py-2 px-3 rounded-lg border font-semibold cursor-pointer ${
                format === 'json'
                  ? 'bg-[#009ED0]/20 border-[#009ED0] text-[#00D4FF]'
                  : 'bg-[#00121F] border-[#064966] text-slate-300'
              }`}
            >
              JSON có cấu trúc
            </button>
          </div>
        </div>

        {scope === 'current_assignment_students' && (
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">Cột dữ liệu học sinh</label>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#00121F] border border-[#064966]/70">
              {AVAILABLE_COLUMNS.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columns.includes(col.id)}
                    onChange={() => toggleCol(col.id)}
                    className="w-3.5 h-3.5 accent-[#009ED0] rounded"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {localError && (
          <div
            role="alert"
            className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-2"
          >
            <span>{localError}</span>
            <button type="button" onClick={handleExport} className="underline font-semibold cursor-pointer">
              Thử lại
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang tạo tệp...' : 'Tải báo cáo xuống'}</span>
          </button>
        </div>
      </div>
    </DarkModalShell>
  );
};

// ==========================================
// ACT-04: CHỈNH SỬA METADATA AN TOÀN
// ==========================================
interface EditMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  hasSubmissions: boolean;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

export const EditMetadataModal: React.FC<EditMetadataModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  hasSubmissions,
  onSuccess,
  onError
}) => {
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [specialInstructions, setSpecialInstructions] = useState(assignment.special_instructions || '');
  const [allowLate, setAllowLate] = useState(assignment.allow_late);
  const [createNewVersion, setCreateNewVersion] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setSpecialInstructions(assignment.special_instructions || '');
      setAllowLate(assignment.allow_late);
      setCreateNewVersion(false);
      setLocalError(null);
    }
  }, [isOpen, assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!title.trim()) {
      setLocalError('Tiêu đề bài tập không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      await AssignmentManagementService.updateAssignmentMetadata(
        actor,
        assignment.id,
        {
          title: title.trim(),
          description: description.trim(),
          special_instructions: specialInstructions.trim(),
          allow_late: allowLate,
          createNewContentVersion: createNewVersion
        },
        assignment.version || 1
      );
      onClose();
      onSuccess(`Đã cập nhật thông tin bài tập "${title.trim()}".`);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin bài tập"
      subtitle={`${assignment.class_name} · ${assignment.subject_name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {hasSubmissions && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200">
            Bài tập đã có học sinh nộp bài. Thang điểm tối đa và quy chế chấm nhiều lượt được khóa để tránh sai
            lệch điểm cũ.
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-200 mb-1">
            Tiêu đề bài tập <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1">Mô tả & Yêu cầu chung</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1">Ghi chú đặc biệt cho học sinh</label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Ví dụ: Nộp kèm ảnh chụp vở trình bày rõ ràng..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
          />
        </div>

        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={allowLate}
            onChange={(e) => setAllowLate(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#009ED0] rounded"
          />
          <span>Cho phép học sinh nộp muộn sau thời hạn</span>
        </label>

        {hasSubmissions && (
          <label className="flex items-center gap-2 text-cyan-200 cursor-pointer">
            <input
              type="checkbox"
              checked={createNewVersion}
              onChange={(e) => setCreateNewVersion(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#009ED0] rounded"
            />
            <span>Đánh dấu phiên bản nội dung mới (content_version +1)</span>
          </label>
        )}

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

// ==========================================
// ACT-11 / ACT-12 / ACT-13: WORKSPACE CHẤM & XEM BÀI LÀM
// ==========================================
interface GradingWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  submissionId: string | null;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
  onOpenReviseModal: (submission: Submission) => void;
}

export const GradingWorkspaceModal: React.FC<GradingWorkspaceModalProps> = ({
  isOpen,
  onClose,
  actor,
  submissionId,
  onSuccess,
  onError,
  onOpenReviseModal
}) => {
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(submissionId);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [student, setStudent] = useState<Student | undefined>(undefined);
  const [allAttempts, setAllAttempts] = useState<Submission[]>([]);
  const [revisions, setRevisions] = useState<GradeRevision[]>([]);
  const [fileValidations, setFileValidations] = useState<Array<{ name: string; valid: boolean; reason?: string }>>([]);
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);

  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActiveSubmissionId(submissionId);
    setPreviewFileIndex(null);
  }, [submissionId]);

  useEffect(() => {
    if (!isOpen || !activeSubmissionId) return;
    setLoading(true);
    setLoadError(null);
    setLocalError(null);
    setPreviewFileIndex(null);
    AssignmentManagementService.getSubmissionDetail(actor, activeSubmissionId)
      .then((res) => {
        setSubmission(res.submission);
        setAssignment(res.assignment);
        setStudent(res.student);
        setAllAttempts(res.allAttempts);
        setRevisions(res.revisions);
        setFileValidations(res.fileValidations);
        setScoreInput(res.submission.score !== undefined ? String(res.submission.score) : '');
        setFeedbackInput(res.submission.feedback || '');
      })
      .catch((err) => {
        setLoadError(err?.message || 'Không thể tải bài làm của học sinh.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, activeSubmissionId, actor]);

  const handleAiFeedback = async () => {
    if (!submission) return;
    setIsAiSuggesting(true);
    try {
      const suggestion = await aiAssistant.generateStudentFeedback({
        studentName: submission.student_name,
        gpa: parseFloat(scoreInput) || 8.0,
        attendanceRate: student?.attendance_rate || 95,
        behaviorScore: student?.behavior_score || 92
      });
      setFeedbackInput(suggestion);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleSave = async (status: 'draft_grade' | 'graded', publishNow = false) => {
    if (!submission || !assignment) return;
    setLocalError(null);
    const parsed = parseFloat(scoreInput);
    if (isNaN(parsed)) {
      setLocalError('Vui lòng nhập điểm số hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      await AssignmentManagementService.gradeSubmission(actor, submission.id, {
        score: parsed,
        feedback: feedbackInput,
        status,
        publishNow,
        version: submission.version || 1
      });
      onClose();
      onSuccess(
        status === 'draft_grade'
          ? `Đã lưu nháp điểm cho ${submission.student_name} (${parsed}đ).`
          : publishNow
          ? `Đã chấm và công bố điểm cho ${submission.student_name} (${parsed}đ).`
          : `Đã chấm hoàn tất bài của ${submission.student_name} (${parsed}đ, chưa trả bài).`
      );
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const gradeStatus = submission?.grade_status || (submission?.status === 'graded' ? 'graded' : 'ungraded');
  const gradeMeta = getGradeStatusMeta(gradeStatus);
  const alreadyFinalized = gradeStatus === 'graded' || gradeStatus === 'published';

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={submission ? `Chấm & Xem bài: ${submission.student_name}` : 'Chấm bài học sinh'}
      subtitle={
        submission && assignment
          ? `${submission.student_code} · ${assignment.title} · Nộp lúc ${formatDateTimeVN(
              submission.submitted_at
            )}`
          : undefined
      }
      maxWidth="3xl"
    >
      {loading && (
        <div className="py-10 text-center text-xs text-slate-400">Đang tải nội dung bài làm...</div>
      )}

      {loadError && (
        <div role="alert" className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs">
          {loadError}
        </div>
      )}

      {!loading && !loadError && submission && assignment && (
        <div className="space-y-4 text-xs">
          {/* Attempt switcher if student submitted multiple times */}
          {allAttempts.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#00121F] border border-[#064966]">
              <span className="text-slate-400 font-medium">Lịch sử lượt nộp:</span>
              {allAttempts.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => setActiveSubmissionId(att.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    att.id === submission.id
                      ? 'bg-[#009ED0] text-white'
                      : 'bg-[#031C2E] border border-[#064966] text-slate-300 hover:border-[#009ED0]'
                  }`}
                >
                  Lần {att.attempt_no || 1} · {formatDateTimeVN(att.submitted_at)}
                  {att.status === 'late' || new Date(att.submitted_at).getTime() > new Date(assignment.due_date).getTime()
                    ? ' (Muộn)'
                    : ''}
                </button>
              ))}
            </div>
          )}

          {/* Two-column layout inside modal: Left Answer & Files | Right Grading Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Answer & Attachments */}
            <div className="lg:col-span-7 space-y-3">
              <div className="p-4 rounded-xl bg-[#00121F] border border-[#064966] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 uppercase text-[11px]">
                    Nội dung bài làm (Lần {submission.attempt_no || 1})
                  </span>
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${gradeMeta.className}`}>
                    {gradeMeta.label}
                  </span>
                </div>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                  {submission.content || 'Học sinh nộp qua tệp đính kèm.'}
                </p>
              </div>

              {/* Attachment cards with MIME/size validation + Preview & Download */}
              {submission.files && submission.files.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#00121F] border border-[#064966] space-y-2">
                  <span className="font-semibold text-slate-200 block text-[11px] uppercase">
                    Tệp đính kèm ({submission.files.length})
                  </span>
                  {submission.files.map((file, idx) => {
                    const validation = fileValidations[idx];
                    const isPreviewOpen = previewFileIndex === idx;
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="rounded-lg bg-[#031C2E] border border-[#064966]/70 overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#00D4FF] truncate">{file.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {file.mime || 'Tệp đính kèm'} ·{' '}
                              {file.size_bytes
                                ? `${Math.round(file.size_bytes / 1024)} KB`
                                : file.size || 'Hợp lệ'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {validation && !validation.valid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-300">
                                <FileWarning className="w-3.5 h-3.5" />
                                {validation.reason}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                                <FileCheck2 className="w-3.5 h-3.5" />
                                An toàn
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setPreviewFileIndex(isPreviewOpen ? null : idx)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#064966] bg-[#00121F] hover:border-[#009ED0] text-slate-200 text-[11px] font-medium cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-[#00D4FF]" />
                              <span>{isPreviewOpen ? 'Ẩn xem trước' : 'Xem tệp'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                downloadSubmissionAttachment(file, {
                                  assignmentTitle: assignment.title,
                                  studentName: submission.student_name,
                                  studentCode: submission.student_code,
                                  submittedAt: submission.submitted_at,
                                  content: submission.content
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#009ED0] hover:bg-[#0086b3] text-white text-[11px] font-semibold cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Tải về</span>
                            </button>
                          </div>
                        </div>

                        {isPreviewOpen && (
                          <div className="p-3 bg-[#00121F] border-t border-[#064966]/70 text-[11px] space-y-2">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                                <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                                <span>Xem nhanh nội dung tệp: {file.name}</span>
                              </span>
                              <span className="font-mono text-slate-400">
                                {file.mime || 'document'} · {file.size || 'N/A'}
                              </span>
                            </div>

                            {file.url && file.url !== '#' && file.mime?.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="max-h-56 rounded-lg border border-[#064966] object-contain mx-auto"
                              />
                            ) : (
                              <div className="p-3 rounded-lg bg-[#031C2E] border border-[#064966]/60 text-slate-200 whitespace-pre-line leading-relaxed">
                                <p className="text-[#00D4FF] font-semibold mb-1">
                                  Tóm tắt bài làm gắn kèm ({submission.student_name}):
                                </p>
                                <p>
                                  {submission.content ||
                                    'Học sinh đính kèm tệp bài làm hoàn chỉnh. Nhấn "Tải về" để lưu bản đầy đủ về máy.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MCQ breakdown if answers exist */}
              {assignment.questions && assignment.questions.length > 0 && submission.answers && (
                <div className="p-3.5 rounded-xl bg-[#00121F] border border-[#064966] space-y-2">
                  <span className="font-semibold text-slate-200 block text-[11px] uppercase">
                    Chi tiết trả lời theo câu ({assignment.questions.length} câu)
                  </span>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {assignment.questions.map((q, qIdx) => {
                      const ans = submission.answers?.[q.id] || '—';
                      const isCorrect = q.correct_answer && ans === q.correct_answer;
                      return (
                        <div
                          key={q.id}
                          className="p-2 rounded-lg bg-[#031C2E] border border-[#064966]/60 flex items-center justify-between gap-2"
                        >
                          <span className="truncate text-slate-200">
                            Câu {qIdx + 1}: {q.question_text}
                          </span>
                          <span
                            className={`font-mono font-bold shrink-0 ${
                              isCorrect ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                          >
                            Chọn: {ans} {q.correct_answer ? `(Đáp án ${q.correct_answer})` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 rounded-xl bg-[#00121F] border border-[#064966] space-y-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Điểm số (0 – {assignment.points_max}đ · bước {assignment.score_step || 0.25}đ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={assignment.points_max || 10}
                    step={assignment.score_step || 0.25}
                    value={scoreInput}
                    disabled={alreadyFinalized}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="VD: 8.5"
                    className="w-full px-3 py-2 rounded-lg bg-[#031C2E] border border-[#064966] text-lg font-mono font-bold text-[#00D4FF] focus:border-[#009ED0] focus:outline-hidden disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-200">Nhận xét chi tiết</label>
                    {!alreadyFinalized && (
                      <button
                        type="button"
                        onClick={handleAiFeedback}
                        disabled={isAiSuggesting}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#064966]/60 hover:bg-[#009ED0]/30 text-[#00D4FF] text-[11px] font-semibold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isAiSuggesting ? 'Đang gợi ý...' : 'Gợi ý nhận xét'}</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    disabled={alreadyFinalized}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Nhập nhận xét ưu điểm và nội dung cần bổ sung..."
                    className="w-full px-3 py-2 rounded-lg bg-[#031C2E] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden disabled:opacity-60"
                  />
                </div>

                {localError && (
                  <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
                    {localError}
                  </div>
                )}

                {alreadyFinalized ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-400">
                      Bài này đã hoàn tất chấm. Để thay đổi điểm, hãy sử dụng chức năng Sửa điểm có ghi nhận lý
                      do kiểm toán.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenReviseModal(submission);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold cursor-pointer"
                    >
                      Mở biểu mẫu Sửa điểm (MOD-03)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave('draft_grade', false)}
                        className="py-2 px-3 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Lưu nháp chấm
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave('graded', false)}
                        className="py-2 px-3 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Hoàn tất chấm
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave('graded', true)}
                      className="w-full py-2 px-3 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Chấm & Công bố điểm ngay</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Immutable Grade Revisions History */}
              <div className="p-3.5 rounded-xl bg-[#00121F] border border-[#064966] space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-[11px] uppercase">
                  <History className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Lịch sử sửa điểm ({revisions.length})</span>
                </div>
                {revisions.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Chưa có lần sửa điểm nào.</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="p-2 rounded-lg bg-[#031C2E] border border-[#064966]/60 text-[11px]">
                        <div className="flex justify-between font-semibold text-slate-100">
                          <span>
                            {rev.old_score ?? '—'} → {rev.new_score}đ
                          </span>
                          <span className="text-slate-400 font-normal">{formatDateTimeVN(rev.changed_at)}</span>
                        </div>
                        <p className="text-slate-300 mt-0.5">Lý do: {rev.reason}</p>
                        <p className="text-slate-400">Bởi: {rev.changed_by}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DarkModalShell>
  );
};

// ==========================================
// ACT-21: GHI NHẬN NỘP TRỰC TIẾP & CHẤM CHO HỌC SINH CHƯA NỘP
// ==========================================
interface DirectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: ActorContext;
  assignment: Assignment;
  student: Student | null;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

const DIRECT_SUBMIT_PRESETS = [
  'Nộp vở trực tiếp trên lớp',
  'Nộp bài giấy kiểm tra tại lớp',
  'Nộp bổ sung qua Zalo/Email lớp có xác nhận'
];

export const DirectSubmissionModal: React.FC<DirectSubmissionModalProps> = ({
  isOpen,
  onClose,
  actor,
  assignment,
  student,
  onSuccess,
  onError
}) => {
  const [note, setNote] = useState(DIRECT_SUBMIT_PRESETS[0]);
  const [gradeNow, setGradeNow] = useState(true);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'draft_grade' | 'graded' | 'published'>('graded');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote(DIRECT_SUBMIT_PRESETS[0]);
      setGradeNow(true);
      setScore('');
      setFeedback('');
      setGradeStatus('graded');
      setLocalError(null);
    }
  }, [isOpen, student?.id]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (note.trim().length < 3) {
      setLocalError('Vui lòng nhập ghi chú hình thức nộp bài (tối thiểu 3 ký tự).');
      return;
    }

    let parsedScore: number | null = null;
    if (gradeNow) {
      parsedScore = parseFloat(score);
      if (isNaN(parsedScore)) {
        setLocalError('Vui lòng nhập điểm số hợp lệ hoặc bỏ chọn "Chấm điểm ngay".');
        return;
      }
    }

    setSubmitting(true);
    try {
      await AssignmentManagementService.recordDirectSubmissionAndGrade(actor, assignment.id, student.id, {
        note: note.trim(),
        score: parsedScore,
        feedback: feedback.trim(),
        gradeStatus: gradeNow ? gradeStatus : 'ungraded'
      });
      onClose();
      onSuccess(
        gradeNow
          ? `Đã ghi nhận nộp trực tiếp & chấm ${parsedScore}/${assignment.points_max}đ cho ${student.full_name}.`
          : `Đã ghi nhận nộp trực tiếp (chờ chấm) cho ${student.full_name}.`
      );
    } catch (err) {
      if (err instanceof ServiceError && (err.status === 400 || err.status === 422)) {
        setLocalError(err.message);
      } else {
        onError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DarkModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Ghi nhận nộp trực tiếp: ${student.full_name}`}
      subtitle={`${student.student_code} · ${assignment.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-[#00121F] border border-[#064966]/80 text-slate-300">
          Chức năng này chuyển học sinh từ trạng thái <strong className="text-white">Chưa nộp</strong> sang{' '}
          <strong className="text-[#00D4FF]">Đã nộp (trực tiếp)</strong> và tự động đồng bộ lại toàn bộ tỷ lệ nộp,
          tab danh sách và KPI.
        </div>

        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Hình thức / Ghi chú nộp bài <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DIRECT_SUBMIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNote(preset)}
                className={`px-2.5 py-1 rounded-md border text-[11px] cursor-pointer transition-colors ${
                  note === preset
                    ? 'bg-[#009ED0]/20 border-[#009ED0] text-[#00D4FF]'
                    : 'bg-[#00121F] border-[#064966] text-slate-300 hover:border-[#009ED0]/60'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập hình thức nộp bài thực tế..."
            className="w-full px-3 py-2 rounded-lg bg-[#00121F] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={gradeNow}
            onChange={(e) => setGradeNow(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#009ED0] rounded"
          />
          <span className="font-semibold">Nhập điểm và nhận xét ngay</span>
        </label>

        {gradeNow && (
          <div className="p-3.5 rounded-xl bg-[#00121F] border border-[#064966] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Điểm số (0 – {assignment.points_max}đ · bước {assignment.score_step || 0.25}đ){' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={assignment.points_max || 10}
                  step={assignment.score_step || 0.25}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="VD: 8.5"
                  className="w-full px-3 py-2 rounded-lg bg-[#031C2E] border border-[#064966] text-base font-mono font-bold text-[#00D4FF] focus:border-[#009ED0] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Trạng thái sau lưu</label>
                <select
                  value={gradeStatus}
                  onChange={(e) => setGradeStatus(e.target.value as 'draft_grade' | 'graded' | 'published')}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#031C2E] border border-[#064966] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
                >
                  <option value="graded">Đã chấm (Chưa trả bài)</option>
                  <option value="published">Đã chấm & Công bố ngay</option>
                  <option value="draft_grade">Chấm nháp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">Nhận xét giáo viên</label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ghi nhận kết quả làm bài trực tiếp của học sinh..."
                className="w-full px-3 py-2 rounded-lg bg-[#031C2E] border border-[#064966] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {localError && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-200">
            {localError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#064966]/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#064966] bg-[#00121F] hover:border-slate-400 text-slate-300 font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#009ED0] hover:bg-[#0086b3] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang lưu...' : 'Xác nhận ghi nhận'}</span>
          </button>
        </div>
      </form>
    </DarkModalShell>
  );
};

