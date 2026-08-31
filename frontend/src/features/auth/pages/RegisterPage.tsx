import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { registerApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { authMessages } from '@/constants/messages/auth';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)').max(255),
  email: z.string().email(authMessages.emailInvalid),
  student_id: z.string().min(2, 'Mã số sinh viên (MSSV) là bắt buộc (tối thiểu 2 ký tự)').max(50),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role.toLowerCase()}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await registerApi({
        full_name: data.full_name,
        email: data.email,
        student_id: data.student_id.trim(),
        password: data.password
      });
      toast.success(authMessages.registerSuccess);
      navigate('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || authMessages.registerFailed;
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100/80">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-soft-bg text-brand-primary font-black text-2xl shadow-sm border border-brand-soft-border mb-1">
            🎓
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {authMessages.registerHeader}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {authMessages.registerSubheader}
          </p>
        </div>

        {/* Teacher Registration Note */}
        <div className="p-3 bg-brand-soft-bg/80 border border-brand-soft-border rounded-xl text-xs font-medium text-brand-heavy-text leading-relaxed">
          {authMessages.teacherNote}
        </div>

        {/* Register Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-bold text-slate-700 mb-1">
                {authMessages.fullNameLabel}
              </label>
              <div className="mt-1">
                <input
                  id="full_name"
                  type="text"
                  placeholder={authMessages.fullNamePlaceholder}
                  className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                    errors.full_name
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                  {...register('full_name')}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
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

            {/* Student ID (MSSV) */}
            <div>
              <label htmlFor="student_id" className="block text-xs font-bold text-slate-700 mb-1">
                {authMessages.studentIdLabel}
              </label>
              <div className="mt-1">
                <input
                  id="student_id"
                  type="text"
                  placeholder={authMessages.studentIdPlaceholder}
                  className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                    errors.student_id
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                  {...register('student_id')}
                />
              </div>
              {errors.student_id && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.student_id.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                {authMessages.passwordLabel}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-xs font-bold text-slate-700 mb-1">
                {authMessages.confirmPasswordLabel}
              </label>
              <div className="mt-1">
                <input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={authMessages.confirmPasswordPlaceholder}
                  className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                    errors.confirm_password
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                  {...register('confirm_password')}
                />
              </div>
              {errors.confirm_password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.confirm_password.message}</p>
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
              {isSubmitting ? authMessages.submittingRegister : authMessages.submitRegister}
            </Button>
          </div>

          {/* Login Link Prompt */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 font-medium">
              {authMessages.hasAccountPrompt}{' '}
              <Link to="/login" className="font-bold text-brand-primary hover:underline ml-1">
                {authMessages.loginNow} →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
