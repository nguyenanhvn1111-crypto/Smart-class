import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_SYSTEM_SETTINGS,
  ThemeMode,
  useTheme
} from '../../contexts/ThemeContext';
import { UserRole } from '../../types';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderOpen,
  GraduationCap,
  KeyRound,
  Monitor,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserCheck,
  UserCog,
  Users
} from 'lucide-react';

export type SettingsTabKey = 'system' | 'display' | 'account';

interface SettingsPageProps {
  defaultTab?: SettingsTabKey;
}

const ROLE_OPTIONS: {
  key: UserRole;
  label: string;
  subtitle: string;
  scope: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    key: 'teacher',
    label: 'Giáo viên',
    subtitle: 'Giảng dạy, điểm danh & chấm bài',
    scope: 'Quản lý lớp học, ngân hàng câu hỏi, giao bài tập và sổ điểm.',
    icon: GraduationCap,
    accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
  },
  {
    key: 'student',
    label: 'Học sinh',
    subtitle: 'Học tập, làm bài & xem điểm cá nhân',
    scope: 'Xem thời khóa biểu, nộp bài tập, làm bài kiểm tra và theo dõi thành tích.',
    icon: UserCheck,
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
  },
  {
    key: 'parent',
    label: 'Phụ huynh',
    subtitle: 'Theo dõi học tập & chuyên cần của con',
    scope: 'Xem bảng điểm, tình hình chuyên cần, lịch học và trao đổi với giáo viên.',
    icon: Users,
    accent: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
  },
  {
    key: 'admin',
    label: 'Quản trị viên',
    subtitle: 'Quản trị toàn trường & phân quyền',
    scope: 'Quản lý trường học, năm học, tài khoản người dùng và nhật ký bảo mật.',
    icon: ShieldCheck,
    accent: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
  }
];

function cropImageSourceToSquareDataUrl(
  source: HTMLImageElement | HTMLVideoElement,
  srcWidth: number,
  srcHeight: number,
  mirrorHorizontal = false
): string {
  const targetSize = 400;
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const side = Math.min(srcWidth, srcHeight);
  const sx = Math.max(0, (srcWidth - side) / 2);
  const sy = Math.max(0, (srcHeight - side) / 2);

  ctx.save();
  if (mirrorHorizontal) {
    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, sx, sy, side, side, 0, 0, targetSize, targetSize);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}

function evaluatePasswordStrength(pwd: string): {
  level: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  if (!pwd) {
    return { level: 0, label: 'Chưa nhập', barColor: 'bg-slate-200 dark:bg-slate-700', textColor: 'text-slate-400' };
  }
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) {
    return { level: 1, label: 'Yếu', barColor: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' };
  }
  if (score === 2) {
    return { level: 2, label: 'Trung bình', barColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' };
  }
  if (score === 3) {
    return { level: 3, label: 'Khá mạnh', barColor: 'bg-blue-600', textColor: 'text-blue-600 dark:text-blue-400' };
  }
  return { level: 4, label: 'Rất mạnh', barColor: 'bg-emerald-600', textColor: 'text-emerald-600 dark:text-emerald-400' };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ defaultTab = 'system' }) => {
  const { user, role, updateProfile, changeAccountRole, changePassword } = useAuth();
  const {
    themeMode,
    setThemeMode,
    displaySettings,
    updateDisplaySettings,
    systemSettings,
    updateSystemSettings,
    resetSystemSettings
  } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab cleanly from URL path
  const resolveTabFromPath = (): SettingsTabKey => {
    if (location.pathname.endsWith('/display')) return 'display';
    if (location.pathname.endsWith('/account') || location.pathname.endsWith('/profile')) return 'account';
    if (location.pathname.endsWith('/system')) return 'system';
    return defaultTab;
  };

  const activeTab = resolveTabFromPath();

  const handleSelectTab = (tab: SettingsTabKey) => {
    navigate(`/${role}/settings/${tab}`);
  };

  // ---------------- System settings state ----------------
  const [sysForm, setSysForm] = useState(systemSettings);
  const [sysNotice, setSysNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    setSysForm(systemSettings);
  }, [systemSettings]);

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(sysForm);
    setSysNotice({ type: 'success', message: 'Đã lưu cấu hình hệ thống thành công.' });
    setTimeout(() => setSysNotice(null), 3500);
  };

  const handleResetSystem = () => {
    resetSystemSettings();
    setSysForm(DEFAULT_SYSTEM_SETTINGS);
    setSysNotice({ type: 'info', message: 'Đã khôi phục cấu hình hệ thống về mặc định.' });
    setTimeout(() => setSysNotice(null), 3500);
  };

  // ---------------- Account profile & avatar state ----------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', message: 'Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', message: 'Kích thước ảnh vượt quá giới hạn 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const cropped = cropImageSourceToSquareDataUrl(img, img.naturalWidth, img.naturalHeight, false);
        if (!cropped) {
          setAvatarMessage({ type: 'error', message: 'Không thể xử lý ảnh đã chọn.' });
          return;
        }
        await updateProfile({ avatar_url: cropped });
        setAvatarMessage({ type: 'success', message: 'Đã cập nhật ảnh đại diện từ thư mục thành công.' });
        setTimeout(() => setAvatarMessage(null), 3500);
      };
      img.onerror = () => {
        setAvatarMessage({ type: 'error', message: 'Tệp ảnh bị lỗi hoặc không thể đọc được.' });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    await updateProfile({ avatar_url: undefined });
    setAvatarMessage({ type: 'success', message: 'Đã xóa ảnh đại diện tùy chỉnh.' });
    setTimeout(() => setAvatarMessage(null), 3000);
  };

  // ---------------- Camera capture modal state ----------------
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStreamActive(false);
  };

  const startCameraStream = async (facing: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);
    setCapturedPhoto(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt hiện tại không hỗ trợ truy cập camera trực tiếp. Bạn có thể chọn ảnh từ thư mục.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStreamActive(true);
    } catch (err: any) {
      let friendly = 'Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trong trình duyệt.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        friendly = 'Bạn đã từ chối quyền truy cập camera. Hãy cấp quyền hoặc tải ảnh trực tiếp từ thư mục.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        friendly = 'Không tìm thấy thiết bị camera trên máy tính này. Bạn có thể tải ảnh từ thư mục.';
      }
      setCameraError(friendly);
    }
  };

  useEffect(() => {
    if (cameraModalOpen && !capturedPhoto) {
      startCameraStream(cameraFacing);
    }
    if (!cameraModalOpen) {
      stopCameraStream();
      setCapturedPhoto(null);
      setCameraError(null);
    }
    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraModalOpen, cameraFacing]);

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const dataUrl = cropImageSourceToSquareDataUrl(
      video,
      video.videoWidth,
      video.videoHeight,
      cameraFacing === 'user'
    );
    if (dataUrl) {
      setCapturedPhoto(dataUrl);
      stopCameraStream();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCameraStream(cameraFacing);
  };

  const handleConfirmCapturedPhoto = async () => {
    if (!capturedPhoto) return;
    await updateProfile({ avatar_url: capturedPhoto });
    setCameraModalOpen(false);
    setAvatarMessage({ type: 'success', message: 'Đã chụp và lưu ảnh đại diện mới thành công.' });
    setTimeout(() => setAvatarMessage(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: fullName.trim() || user?.full_name, phone: phone.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // ---------------- Password change state ----------------
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const pwdStrength = evaluatePasswordStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!currentPassword.trim()) {
      setPwdFeedback({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdFeedback({ type: 'error', message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({ type: 'error', message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.' });
      return;
    }

    setIsUpdatingPwd(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsUpdatingPwd(false);

    if (res.success) {
      setPwdFeedback({ type: 'success', message: res.message || 'Đã cập nhật mật khẩu mới thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdFeedback(null), 4000);
    } else {
      setPwdFeedback({ type: 'error', message: res.error || 'Không thể đổi mật khẩu.' });
    }
  };

  // ---------------- Account role change state ----------------
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [confirmRoleDialogOpen, setConfirmRoleDialogOpen] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(role);
  }, [role]);

  const handleConfirmRoleChange = async () => {
    setConfirmRoleDialogOpen(false);
    if (selectedRole === role) return;
    await changeAccountRole(selectedRole);
    const roleLabel = ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label || selectedRole;
    setRoleFeedback(`Đã chuyển vai trò tài khoản sang "${roleLabel}". Thanh điều hướng đã được cập nhật.`);
    navigate(`/${selectedRole}/settings/account`, { replace: true });
    setTimeout(() => setRoleFeedback(null), 5000);
  };

  const activeRoleMeta = ROLE_OPTIONS.find((r) => r.key === role);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header & Segmented Sub-Module Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Tiện ích & Báo cáo</span>
            <span aria-hidden="true">·</span>
            <span>Cài đặt</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Vai trò: {activeRoleMeta?.label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Trung tâm Cài đặt
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý cấu hình hệ thống, phông nền hiển thị Trắng/Đen và thông tin bảo mật tài khoản.
          </p>
        </div>

        {/* Interactive Segmented Tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl self-start lg:self-auto"
          role="tablist"
          aria-label="Phân mục cài đặt"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'system'}
            onClick={() => handleSelectTab('system')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Cài đặt hệ thống</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'display'}
            onClick={() => handleSelectTab('display')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'display'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4 shrink-0" />
            <span>Cài đặt màn hình</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'account'}
            onClick={() => handleSelectTab('account')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCog className="w-4 h-4 shrink-0" />
            <span>Cài đặt tài khoản</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: CÀI ĐẶT HỆ THỐNG                                           */}
      {/* ================================================================= */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSystem} className="space-y-6">
          {sysNotice && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border ${
                sysNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{sysNotice.message}</span>
            </div>
          )}

          {/* Unit & Academic Year Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Thông tin đơn vị & Niên khóa mặc định
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Áp dụng làm giá trị mặc định cho báo cáo, lịch học và các biểu mẫu bài tập.
                </p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên trường / Đơn vị giáo dục
                </label>
                <input
                  type="text"
                  value={sysForm.schoolName}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Năm học hiện tại
                </label>
                <select
                  value={sysForm.academicYear}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                >
                  <option value="2025 - 2026">2025 - 2026</option>
                  <option value="2026 - 2027">2026 - 2027</option>
                  <option value="2027 - 2028">2027 - 2028</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Học kỳ mặc định
                </label>
                <select
                  value={sysForm.semester}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, semester: e.target.value as '1' | '2' }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                >
                  <option value="1">Học kỳ 1</option>
                  <option value="2">Học kỳ 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Múi giờ hiển thị hạn nộp
                </label>
                <select
                  value={sysForm.timezone}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ngưỡng cảnh báo vắng học liên tiếp
                </label>
                <select
                  value={sysForm.absenceAlertThreshold}
                  onChange={(e) =>
                    setSysForm((prev) => ({ ...prev, absenceAlertThreshold: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden tabular-nums"
                >
                  <option value={2}>Từ 2 buổi trở lên</option>
                  <option value={3}>Từ 3 buổi trở lên</option>
                  <option value={5}>Từ 5 buổi trở lên</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Automation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Vận hành lớp học & Nhắc nhở tự động
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Điều chỉnh hành vi lưu nháp, nhắc hạn bài tập và thông báo trong phiên làm việc.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <label className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Tự động lưu nháp khi soạn đề & chấm bài
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bảo vệ dữ liệu chấm điểm và nhận xét chưa công bố khi mất kết nối tạm thời.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sysForm.autoSaveDrafts}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, autoSaveDrafts: e.target.checked }))}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Cho phép nộp muộn mặc định khi giao bài mới
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Học sinh vẫn có thể gửi bài sau hạn và hệ thống tự động gắn nhãn Nộp muộn.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sysForm.allowLateSubmissionDefault}
                  onChange={(e) =>
                    setSysForm((prev) => ({ ...prev, allowLateSubmissionDefault: e.target.checked }))
                  }
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Bật thông báo âm thanh khi có cập nhật mới
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phát tín hiệu nhẹ khi nhận bài nộp mới hoặc thông báo khẩn từ nhà trường.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sysForm.soundNotifications}
                  onChange={(e) => setSysForm((prev) => ({ ...prev, soundNotifications: e.target.checked }))}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Nhắc học sinh chưa nộp bài trước hạn
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Thời điểm gửi cảnh báo nhắc nộp tự động trước thời hạn kết thúc.
                  </p>
                </div>
                <select
                  value={sysForm.assignmentReminderHours}
                  onChange={(e) =>
                    setSysForm((prev) => ({
                      ...prev,
                      assignmentReminderHours: e.target.value as 'off' | '24' | '48'
                    }))
                  }
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-hidden shrink-0"
                >
                  <option value="24">Trước 24 giờ</option>
                  <option value="48">Trước 48 giờ</option>
                  <option value="off">Tắt nhắc tự động</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetSystem}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Khôi phục mặc định</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Lưu cài đặt hệ thống</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ================================================================= */}
      {/* TAB 2: CÀI ĐẶT MÀN HÌNH (PHÔNG NỀN TRẮNG / ĐEN)                   */}
      {/* ================================================================= */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Màu phông nền màn hình
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn phông nền Trắng (sáng) hoặc Đen (tối). Thay đổi được áp dụng ngay lập tức trên toàn hệ thống.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                Đang dùng: {themeMode === 'dark' ? 'Phông nền Đen' : 'Phông nền Trắng'}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Light Theme Option */}
              {([
                {
                  key: 'light' as ThemeMode,
                  title: 'Phông nền Trắng (Sáng)',
                  desc: 'Nền trắng sáng, chữ tối độ tương phản cao, phù hợp làm việc ban ngày và phòng học nhiều ánh sáng.',
                  icon: Sun,
                  previewCanvas: 'bg-slate-50 border-slate-200',
                  previewHeader: 'bg-white border-slate-200',
                  previewCard: 'bg-white border-slate-200',
                  previewLine1: 'bg-slate-800',
                  previewLine2: 'bg-slate-300'
                },
                {
                  key: 'dark' as ThemeMode,
                  title: 'Phông nền Đen (Tối)',
                  desc: 'Nền tối dịu mắt, giảm chói màn hình khi làm việc buổi tối và giữ nguyên độ sắc nét của dữ liệu.',
                  icon: Moon,
                  previewCanvas: 'bg-[#090d16] border-slate-800',
                  previewHeader: 'bg-slate-900 border-slate-800',
                  previewCard: 'bg-slate-900 border-slate-800',
                  previewLine1: 'bg-slate-100',
                  previewLine2: 'bg-slate-700'
                }
              ]).map((option) => {
                const Icon = option.icon;
                const isSelected = themeMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setThemeMode(option.key)}
                    aria-pressed={isSelected}
                    className={`text-left rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col gap-4 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Live Mini Wireframe Preview */}
                    <div className={`w-full h-36 rounded-xl border overflow-hidden flex ${option.previewCanvas}`}>
                      {/* Mini dark sidebar */}
                      <div className="w-12 bg-slate-950 border-r border-slate-800 p-2 flex flex-col gap-1.5 shrink-0">
                        <div className="w-5 h-5 rounded-md bg-blue-600 mb-1" />
                        <div className="h-1.5 w-full rounded bg-slate-700" />
                        <div className="h-1.5 w-4/5 rounded bg-blue-500/70" />
                        <div className="h-1.5 w-full rounded bg-slate-800" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                      </div>
                      {/* Mini content canvas */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className={`h-7 border-b px-3 flex items-center justify-between ${option.previewHeader}`}>
                          <div className={`h-2 w-16 rounded ${option.previewLine2}`} />
                          <div className="w-4 h-4 rounded-full bg-blue-600" />
                        </div>
                        <div className="p-3 space-y-2.5 flex-1">
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`h-9 rounded-lg border p-2 ${option.previewCard}`}>
                              <div className={`h-1.5 w-8 rounded mb-1.5 ${option.previewLine2}`} />
                              <div className={`h-2.5 w-6 rounded ${option.previewLine1}`} />
                            </div>
                            <div className={`h-9 rounded-lg border p-2 ${option.previewCard}`}>
                              <div className={`h-1.5 w-8 rounded mb-1.5 ${option.previewLine2}`} />
                              <div className={`h-2.5 w-6 rounded ${option.previewLine1}`} />
                            </div>
                            <div className={`h-9 rounded-lg border p-2 ${option.previewCard}`}>
                              <div className={`h-1.5 w-8 rounded mb-1.5 ${option.previewLine2}`} />
                              <div className={`h-2.5 w-6 rounded ${option.previewLine1}`} />
                            </div>
                          </div>
                          <div className={`h-11 rounded-lg border p-2.5 flex items-center justify-between ${option.previewCard}`}>
                            <div className="space-y-1.5">
                              <div className={`h-2 w-24 rounded ${option.previewLine1}`} />
                              <div className={`h-1.5 w-32 rounded ${option.previewLine2}`} />
                            </div>
                            <div className="h-5 w-12 rounded-md bg-blue-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            option.key === 'light'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {option.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {option.desc}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra Display Options */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tùy chỉnh khả năng hiển thị
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Điều chỉnh mật độ trình bày và hiệu ứng chuyển động phù hợp với thói quen sử dụng.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Mật độ giao diện
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn bố cục thoáng tiêu chuẩn hoặc thu gọn để xem được nhiều dữ liệu hơn trên một màn hình.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => updateDisplaySettings({ density: 'comfortable' })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      displaySettings.density === 'comfortable'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tiêu chuẩn
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDisplaySettings({ density: 'compact' })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      displaySettings.density === 'compact'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Thu gọn
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Giảm hiệu ứng chuyển động
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tắt hoạt ảnh chuyển tiếp để thao tác nhanh hơn hoặc hạn chế mỏi mắt.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={displaySettings.reduceMotion}
                  onChange={(e) => updateDisplaySettings({ reduceMotion: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: CÀI ĐẶT TÀI KHOẢN                                          */}
      {/* ================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* 1. Avatar Upload / Camera Capture & Profile Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ảnh đại diện & Thông tin cá nhân
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tải ảnh có sẵn từ thư mục trên thiết bị hoặc chụp ảnh mới trực tiếp bằng camera.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {avatarMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                    avatarMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {avatarMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{avatarMessage.message}</span>
                </div>
              )}

              {profileSaved && (
                <div className="p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Đã lưu thông tin cá nhân thành công!</span>
                </div>
              )}

              {/* Avatar Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
                <UserAvatar
                  src={user?.avatar_url}
                  name={user?.full_name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-50 dark:ring-slate-800 shadow-xs text-2xl"
                />
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {user?.full_name}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        · {activeRoleMeta?.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {user?.email} · Hỗ trợ JPG, PNG, WEBP tối đa 5MB (tự động căn vuông 1:1)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FolderOpen className="w-4 h-4 shrink-0" />
                      <span>Tải ảnh từ thư mục</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCameraModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>Chụp ảnh mới (Camera)</span>
                    </button>

                    {user?.avatar_url && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Xóa ảnh</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Fields Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Họ và tên hiển thị
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Số điện thoại liên lạc
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email tài khoản (Định danh)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>Lưu thông tin hồ sơ</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 2. Password Change Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Thay đổi mật khẩu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tối thiểu 6 ký tự (khuyến nghị kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt). Tài khoản mẫu mặc định: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">password123</span>.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd((p) => !p)}
                      aria-label="Hiện hoặc ẩn mật khẩu hiện tại"
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((p) => !p)}
                      aria-label="Hiện hoặc ẩn mật khẩu mới"
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((p) => !p)}
                      aria-label="Hiện hoặc ẩn xác nhận mật khẩu"
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className={`font-semibold ${pwdStrength.textColor}`}>{pwdStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-colors ${
                          step <= pwdStrength.level
                            ? pwdStrength.barColor
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pwdFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                    pwdFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {pwdFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{pwdFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isUpdatingPwd}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-60 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>{isUpdatingPwd ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Account Role Change Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Thay đổi vai trò của tài khoản
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chuyển đổi vai trò làm việc mà vẫn giữ nguyên ảnh đại diện và thông tin hồ sơ của bạn.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
                Hiện tại: {activeRoleMeta?.label}
              </span>
            </div>

            <div className="p-6 space-y-5">
              {roleFeedback && (
                <div className="p-3.5 rounded-xl text-xs font-semibold flex flex-wrap items-center justify-between gap-3 border bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{roleFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/${role}/dashboard`)}
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 underline font-bold cursor-pointer"
                  >
                    <span>Đi tới trang Tổng quan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isCurrent = opt.key === role;
                  const isSelected = opt.key === selectedRole;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedRole(opt.key)}
                      className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${opt.accent}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {opt.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                              Đang dùng
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                          {opt.subtitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {opt.scope}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate(`/${role}/dashboard`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <span>Mở Tổng quan ({activeRoleMeta?.label})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={selectedRole === role}
                  onClick={() => setConfirmRoleDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedRole === role
                      ? 'Đang ở vai trò này'
                      : `Chuyển sang vai trò ${ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <Modal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        title="Chụp ảnh đại diện mới"
        subtitle="Canh khuôn mặt vào khung vuông và nhấn Chụp ảnh"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="relative w-full aspect-square max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Ảnh vừa chụp"
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{cameraError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startCameraStream(cameraFacing)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraModalOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Chọn từ thư mục</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
                />
                {!cameraStreamActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-slate-300 text-xs">
                    <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang khởi động camera...</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {!capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đổi camera</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={!cameraStreamActive}
                    onClick={handleCapturePhoto}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Chụp ảnh</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chụp lại</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCapturedPhoto}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu làm ảnh đại diện</span>
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmRoleDialogOpen}
        onClose={() => setConfirmRoleDialogOpen(false)}
        onConfirm={handleConfirmRoleChange}
        isDestructive={false}
        title="Xác nhận đổi vai trò tài khoản"
        message={`Bạn sắp thay đổi vai trò tài khoản từ "${activeRoleMeta?.label}" sang "${
          ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label
        }". Ảnh đại diện và thông tin hồ sơ của bạn sẽ được giữ nguyên.`}
        confirmLabel="Xác nhận chuyển vai trò"
        cancelLabel="Hủy bỏ"
      />
    </div>
  );
};
