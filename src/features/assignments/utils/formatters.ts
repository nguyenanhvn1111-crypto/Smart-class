import { AssignmentReceiveStatus, GradeStatus, NotificationChannel } from '../../../types';

export function formatDateTimeVN(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toLocaleString('vi-VN');
  }
}

export function formatShortDateVN(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return d.toLocaleDateString('vi-VN');
  }
}

export function toDatetimeLocalValue(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 3 * 86400000);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDelayDuration(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes < 60) return `Trễ ${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `Trễ ${hours}g ${mins}p` : `Trễ ${hours} giờ`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `Trễ ${days} ngày ${remHours}g` : `Trễ ${days} ngày`;
}

export function getAssignmentTypeLabel(type?: string): string {
  if (type === 'exam') return 'Bài kiểm tra';
  if (type === 'classwork') return 'Trên lớp';
  return 'Bài tập về nhà';
}

export function getGradingPolicyLabel(policy?: string): string {
  if (policy === 'highest_score') return 'Lấy điểm cao nhất';
  if (policy === 'teacher_selected') return 'Giáo viên chọn lượt';
  return 'Lấy lần nộp cuối hợp lệ';
}

export function getReceiveStatusMeta(
  status: AssignmentReceiveStatus,
  options?: { isPastDue?: boolean; allowLate?: boolean }
): {
  label: string;
  className: string;
  isPastDueOpen?: boolean;
} {
  if (status === 'open' && options?.isPastDue) {
    if (options.allowLate === false) {
      return {
        label: 'Đã hết hạn',
        className: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
        isPastDueOpen: true
      };
    }
    return {
      label: 'Quá hạn · Nhận muộn',
      className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      isPastDueOpen: true
    };
  }

  switch (status) {
    case 'open':
      return {
        label: 'Đang nhận bài',
        className: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
      };
    case 'scheduled':
      return {
        label: 'Chưa mở',
        className: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
      };
    case 'closed':
      return {
        label: 'Đã đóng nhận',
        className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      };
    case 'withdrawn':
      return {
        label: 'Đã thu hồi',
        className: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
      };
    case 'draft':
    default:
      return {
        label: 'Bản nháp',
        className: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      };
  }
}

export function getSubmissionStatusMeta(isSubmitted: boolean, isLate: boolean): {
  label: string;
  className: string;
} {
  if (!isSubmitted) {
    return {
      label: 'Chưa nộp',
      className: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    };
  }
  if (isLate) {
    return {
      label: 'Nộp muộn',
      className: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
    };
  }
  return {
    label: 'Đã nộp',
    className: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
  };
}

export function getGradeStatusMeta(status: GradeStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'published':
      return {
        label: 'Đã chấm · Đã trả',
        className: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
      };
    case 'graded':
      return {
        label: 'Đã chấm (Chưa trả)',
        className: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
      };
    case 'draft_grade':
      return {
        label: 'Chấm nháp',
        className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      };
    case 'ungraded':
    default:
      return {
        label: 'Chưa chấm',
        className: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      };
  }
}

export function getNotificationChannelLabel(channel: NotificationChannel): string {
  if (channel === 'parent_app') return 'App Phụ huynh';
  if (channel === 'email') return 'Email học sinh / PH';
  return 'Thông báo hệ thống';
}

export function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSubmissionAttachment(
  file: { name: string; url: string; mime?: string; size?: string },
  context?: {
    assignmentTitle?: string;
    studentName?: string;
    studentCode?: string;
    submittedAt?: string;
    content?: string;
  }
): void {
  if (file.url && file.url !== '#' && (file.url.startsWith('http') || file.url.startsWith('blob:') || file.url.startsWith('data:'))) {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback for seeded prototype attachments (url === '#'): download structured submission sheet
  const textContent = [
    `SMART CLASS 4.0 - BẢN SAO TỆP BÀI LÀM`,
    `========================================`,
    `Tên tệp gốc: ${file.name}`,
    `Định dạng: ${file.mime || 'Không xác định'} (${file.size || 'N/A'})`,
    context?.assignmentTitle ? `Bài tập: ${context.assignmentTitle}` : '',
    context?.studentName ? `Học sinh: ${context.studentName} (${context.studentCode || ''})` : '',
    context?.submittedAt ? `Thời gian nộp: ${formatDateTimeVN(context.submittedAt)}` : '',
    ``,
    `--- NỘI DUNG BÀI NỘP GHI NHẬN TRÊN HỆ THỐNG ---`,
    context?.content || '(Học sinh nộp bài qua tệp đính kèm.)'
  ]
    .filter(Boolean)
    .join('\n');

  const safeName = `${file.name.replace(/\.[^.]+$/, '')}_ban_sao.txt`;
  downloadTextFile(safeName, 'text/plain;charset=utf-8;', '\uFEFF' + textContent);
}

