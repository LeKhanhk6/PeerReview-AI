import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { authMessages } from '@/constants/messages/auth';

const loginSchema = z.object({
  email: z.string().email(authMessages.emailInvalid),
  password: z.string().min(1, authMessages.passwordRequired),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated, setAuth, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const defaultDashboard = `/${user.role.toLowerCase()}/dashboard`;
      navigate(defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [apiLockedError, setApiLockedError] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setApiLockedError(false);
    try {
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100/80">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-soft-bg text-brand-primary font-black text-2xl shadow-sm border border-brand-soft-border mb-1">
            🤖
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {authMessages.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {authMessages.loginSubheader}
          </p>
        </div>

        {/* Account Locked Alert Banner */}
        {isLocked && (
          <div role="alert" className="p-3.5 bg-badge-danger-bg border border-badge-danger-border rounded-xl text-xs font-semibold text-badge-danger-text flex items-start gap-2.5 shadow-sm">
            <span className="text-base shrink-0">⚠️</span>
            <span>{authMessages.accountLocked}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                {authMessages.emailLabel}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={authMessages.emailPlaceholder}
                  className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700">
                  {authMessages.passwordLabel}
                </label>
                <span className="text-xs text-slate-500 font-medium hover:text-brand-primary cursor-not-allowed" title="Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu">
                  {authMessages.forgotPassword}
                </span>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={authMessages.passwordPlaceholder}
                  className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                    errors.password
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full flex justify-center py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md transition-colors"
              isLoading={isSubmitting}
            >
              {isSubmitting ? authMessages.submittingLogin : authMessages.submitLogin}
            </Button>
          </div>

          {/* Register Prompt */}
          <div className="text-center pt-2 border-t border-slate-100">
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
  );
};
