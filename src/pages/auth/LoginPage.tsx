import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { DEMO_USERS } from '../../services/seedData';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  const { login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterPath = location.pathname.includes('/register') || initialMode === 'register';
  const [authMode, setAuthMode] = useState<'login' | 'register'>(isRegisterPath ? 'register' : 'login');

  useEffect(() => {
    if (location.pathname.includes('/register')) {
      setAuthMode('register');
    }
  }, [location.pathname]);

  // Login form state
  const [email, setEmail] = useState('teacher@smartclass.edu.vn');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModal, setIsForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  const demoAccounts: { role: UserRole; name: string; email: string; desc: string; color: string }[] = [
    {
      role: 'teacher',
      name: 'Cô Trần Thị Mai',
      email: 'teacher@smartclass.edu.vn',
      desc: 'Giáo viên chủ nhiệm lớp 10A1',
      color: 'border-blue-200 bg-blue-50/50 hover:border-blue-500'
    },
    {
      role: 'student',
      name: 'Lê Hoàng Long',
      email: 'student@smartclass.edu.vn',
      desc: 'Học sinh lớp 10A1 (HS10001)',
      color: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-500'
    },
    {
      role: 'parent',
      name: 'Ông Lê Văn Minh',
      email: 'parent@smartclass.edu.vn',
      desc: 'Phụ huynh 2 con (Long & Minh Anh)',
      color: 'border-purple-200 bg-purple-50/50 hover:border-purple-500'
    },
    {
      role: 'admin',
      name: 'TS. Nguyễn Văn Bình',
      email: 'admin@smartclass.edu.vn',
      desc: 'Hiệu trưởng & Quản trị hệ thống',
      color: 'border-rose-200 bg-rose-50/50 hover:border-rose-500'
    }
  ];

  const roleOptions: { role: UserRole; title: string; badge: string; desc: string; color: string; activeColor: string }[] = [
    {
      role: 'teacher',
      title: 'Giáo viên',
      badge: 'TEACHER',
      desc: 'Soạn giáo án, đề thi & quản lý lớp',
      color: 'border-slate-200 bg-white hover:border-blue-300',
      activeColor: 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
    },
    {
      role: 'student',
      title: 'Học sinh',
      badge: 'STUDENT',
      desc: 'Làm bài tập, thi trực tuyến & xem điểm',
      color: 'border-slate-200 bg-white hover:border-emerald-300',
      activeColor: 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
    },
    {
      role: 'parent',
      title: 'Phụ huynh',
      badge: 'PARENT',
      desc: 'Theo dõi con, nhận thông báo & sổ liên lạc',
      color: 'border-slate-200 bg-white hover:border-purple-300',
      activeColor: 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
    },
    {
      role: 'admin',
      title: 'Quản trị viên',
      badge: 'ADMIN',
      desc: 'Quản lý toàn trường & phân quyền học vụ',
      color: 'border-slate-200 bg-white hover:border-rose-300',
      activeColor: 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20'
    }
  ];

  const redirectToRole = (role: UserRole) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'student') navigate('/student/dashboard');
    else if (role === 'parent') navigate('/parent/dashboard');
    else navigate('/teacher/dashboard');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const success = await login(email);
    setIsLoading(false);

    if (success) {
      const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      const role = user?.role || 'teacher';
      redirectToRole(role);
    } else {
      setLoginError('Đăng nhập không thành công, vui lòng kiểm tra lại email.');
    }
  };

  const handleQuickLogin = async (userEmail: string, role: UserRole) => {
    setIsLoading(true);
    await login(userEmail, role);
    setIsLoading(false);
    redirectToRole(role);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim()) {
      setRegError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Mật khẩu bảo mật phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    if (!agreeTerms) {
      setRegError('Vui lòng xác nhận đồng ý với Điều khoản dịch vụ.');
      return;
    }

    setIsLoading(true);
    const res = await register({
      full_name: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      phone: regPhone.trim() || undefined
    });
    setIsLoading(false);

    if (res.success) {
      setRegSuccess(true);
      setTimeout(() => {
        redirectToRole(regRole);
      }, 900);
    } else {
      setRegError(res.error || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
    }
  };

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModal(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          SmartClass Platform
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Hệ thống Quản lý Lớp học & Ngân hàng Câu hỏi Thông minh
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Main Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200/80 space-y-6">
          
          {/* Segmented Tab Switcher (Đăng nhập / Đăng ký) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: FORM ĐĂNG NHẬP (LOGIN)                           */}
          {/* ======================================================== */}
          {authMode === 'login' ? (
            <>
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@smartclass.edu.vn"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModal(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Google Firebase Login */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full absolute" />
                  <span className="bg-white px-3 text-xs text-slate-400 relative">hoặc</span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    const success = await loginWithGoogle();
                    setIsLoading(false);
                    if (success) {
                      navigate('/teacher/dashboard');
                    }
                  }}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Đăng nhập Google (Firebase Auth)</span>
                </button>
              </form>

              {/* Switch to Register link */}
              <div className="text-center text-xs text-slate-500 pt-1">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Đăng ký tài khoản mới ngay
                </button>
              </div>

              {/* Quick Demo Access Buttons */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
                  ⚡ ĐĂNG NHẬP NHANH DEMO (1-CLICK)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickLogin(acc.email, acc.role)}
                      className={`p-3 rounded-2xl border text-left transition-all ${acc.color} group cursor-pointer`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {acc.role}
                      </span>
                      <p className="font-bold text-xs text-slate-900 line-clamp-1">{acc.name}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{acc.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ======================================================== */
            /* TAB 2: FORM ĐĂNG KÝ (REGISTER)                          */
            /* ======================================================== */
            <>
              {regSuccess ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center space-y-2 animate-in fade-in">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">Đăng ký thành công!</h4>
                  <p className="text-xs text-emerald-700">
                    Chào mừng bạn đến với SmartClass. Đang chuyển hướng vào bảng điều khiển...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="ThS. Nguyễn Văn An"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Địa chỉ Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nguyenvanan@smartclass.edu.vn"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-slate-400 text-[11px]">(tùy chọn)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mật khẩu <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Ít nhất 6 ký tự"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Xác nhận lại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vai trò trong trường học */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Chọn vai trò tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((opt) => (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => setRegRole(opt.role)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            regRole === opt.role ? opt.activeColor : opt.color
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {opt.badge}
                            </span>
                            {regRole === opt.role && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <p className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">
                            {opt.title}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {opt.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Điều khoản sử dụng */}
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Tôi đồng ý với{' '}
                      <span className="text-blue-600 font-semibold hover:underline">
                        Điều khoản dịch vụ
                      </span>{' '}
                      và{' '}
                      <span className="text-blue-600 font-semibold hover:underline">
                        Chính sách bảo mật
                      </span>{' '}
                      của SmartClass.
                    </span>
                  </label>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span>{isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản vào hệ thống'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Google Firebase Register */}
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full absolute" />
                    <span className="bg-white px-3 text-xs text-slate-400 relative">hoặc</span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      const success = await loginWithGoogle();
                      setIsLoading(false);
                      if (success) {
                        navigate('/teacher/dashboard');
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Đăng ký nhanh với Google (Firebase Auth)</span>
                  </button>

                  {/* Switch back to Login link */}
                  <div className="text-center text-xs text-slate-500 pt-1">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Khôi phục mật khẩu</h3>
            <p className="text-xs text-slate-500">
              Nhập email tài khoản của bạn để nhận liên kết đặt lại mật khẩu an toàn
            </p>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Liên kết đặt lại mật khẩu đã được gửi đến email!</span>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-4">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@smartclass.edu.vn"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                  >
                    Gửi liên kết
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
