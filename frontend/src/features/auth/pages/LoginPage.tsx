import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, BookOpen, Users, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { loginApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { authMessages } from '@/constants/messages/auth';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

const loginSchema = z.object({
  email: z.string().email(authMessages.emailInvalid),
  password: z.string().min(1, authMessages.passwordRequired),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated, setAuth, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [apiLockedError, setApiLockedError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Prefill remembered email if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultDashboard = `/${user.role.toLowerCase()}/dashboard`;
      navigate(defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setApiLockedError(false);
    try {
      // Save or clear remembered email (never save password)
      if (rememberMe) {
        localStorage.setItem('remember_email', data.email.trim());
      } else {
        localStorage.removeItem('remember_email');
      }

      const response = await loginApi(data);
      const userObj = response.user;
      const token = (response as any).accessToken || (response as any).token;
      setAuth(userObj, token);

      try {
        await checkAuth();
      } catch (e) {
        // If checkAuth fails, setAuth still holds valid user state
      }

      toast.success(authMessages.loginSuccess);

      if (userObj?.role) {
        navigate(`/${userObj.role.toLowerCase()}/dashboard`, { replace: true });
      }
    } catch (error: any) {
      const status = error.response?.status || error.status;
      const errorMsg = error.response?.data?.message || error.message || authMessages.loginFailed;

      if (status === 403 || errorMsg.toLowerCase().includes('lock') || errorMsg.toLowerCase().includes('khóa')) {
        setApiLockedError(true);
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = new URLSearchParams(window.location.search).get('reason') === 'locked' || apiLockedError;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* 2-Column Split-Screen Container */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-slate-100/80">
        
        {/* LEFT COLUMN: Brand Hero Panel (Visible >= md) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-primary via-brand-gradient-mid to-brand-gradient-deep p-10 lg:p-12 flex-col justify-between relative overflow-hidden text-white">
          
          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{authMessages.title}</span>
            </div>
          </div>

          {/* SVG Inline Academic Peer Review Illustration Pattern */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chấm chéo Ẩn danh 2 chiều</h3>
                    <p className="text-[11px] text-blue-100">Đánh giá khách quan & Công bằng</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Double-Blind
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Cố vấn AI Real-time</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bảo mật 100%</span>
                </div>
              </div>
            </div>

            {/* Decorative SVG Shapes */}
            <svg
              className="absolute -top-16 -right-16 w-64 h-64 opacity-20 pointer-events-none"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="1.5" />
              <path d="M40 100 H160 M100 40 V160" stroke="white" strokeWidth="1" />
            </svg>
          </div>

          {/* Bottom Overlay Info */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
              {authMessages.academicPlatformTitle}
            </h2>
            <p className="text-xs lg:text-sm text-blue-100 leading-relaxed opacity-90">
              {authMessages.academicPlatformSubtitle}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Panel (~50%) */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {authMessages.welcomeBack}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {authMessages.loginPageSubtext}
              </p>
            </div>

            {/* Account Locked Alert Banner */}
            {isLocked && (
              <div role="alert" className="p-3.5 bg-badge-danger-bg border border-badge-danger-border rounded-xl text-xs font-semibold text-badge-danger-text flex items-start gap-2.5 shadow-sm">
                <span className="text-base shrink-0">⚠️</span>
                <span>{authMessages.accountLocked}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-900 mb-1.5">
                  {authMessages.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={authMessages.emailPlaceholder}
                    className={`appearance-none block w-full pl-10 pr-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.email
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-900 mb-1.5">
                  {authMessages.passwordLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={authMessages.passwordPlaceholder}
                    className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.password
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Controls Row: Remember Me Checkbox & Forgot Password Link */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span>{authMessages.rememberMe}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-brand-primary font-bold hover:underline cursor-pointer"
                >
                  {authMessages.forgotPassword}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full flex justify-center py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md transition-colors text-sm"
                isLoading={isSubmitting}
              >
                {isSubmitting ? authMessages.submittingLogin : authMessages.submitLogin}
              </Button>

              {/* Divider & Register Link */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  {authMessages.noAccountPrompt}{' '}
                  <Link to="/register" className="font-bold text-brand-primary hover:underline ml-1">
                    {authMessages.registerNow} →
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
};
