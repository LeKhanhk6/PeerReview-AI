import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, GraduationCap, Lock, KeyRound, Eye, EyeOff, Palette } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { registerApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { authMessages } from '@/constants/messages/auth';
import { AuthIllustrationPanel } from '../components/AuthIllustrationPanel';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-2 sm:p-4 lg:p-6">
      {/* 2-Column Split-Screen Container */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl w-full flex flex-col md:flex-row border border-slate-100/80 my-auto">
        
        {/* LEFT COLUMN: Shared Brand Hero Panel (Visible >= md) */}
        <AuthIllustrationPanel
          title="Tạo tài khoản mới"
          subtitle="Tham gia nền tảng đánh giá đồng cấp thông minh bằng AI."
        />

        {/* RIGHT COLUMN: Form Panel (~50%) */}
        <div className="w-full md:w-1/2 p-4 sm:p-5 lg:p-6 flex flex-col justify-center bg-white">
          <div className="space-y-2.5">
            {/* Header with Mascot Icon */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                  {authMessages.registerHeader}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {authMessages.registerSubheader}
                </p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-soft-bg flex items-center justify-center text-brand-primary shadow-xs border border-brand-soft-border shrink-0 ml-2" title="PeerReview AI Mascot">
                <Palette size={16} />
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-[11px] font-bold text-slate-900 mb-0.5">
                  {authMessages.fullNameLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="Trần Hữu P."
                    className={`appearance-none block w-full pl-9 pr-3 py-1.5 border rounded-xl shadow-xs text-xs font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.full_name
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-slate-900 mb-0.5">
                  {authMessages.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tranhuup@truong.edu.vn"
                    className={`appearance-none block w-full pl-9 pr-3 py-1.5 border rounded-xl shadow-xs text-xs font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.email
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Student ID (MSSV) */}
              <div>
                <label htmlFor="student_id" className="block text-[11px] font-bold text-slate-900 mb-0.5">
                  {authMessages.studentIdLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="student_id"
                    type="text"
                    placeholder="2026123456"
                    className={`appearance-none block w-full pl-9 pr-3 py-1.5 border rounded-xl shadow-xs text-xs font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.student_id
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('student_id')}
                  />
                </div>
                {errors.student_id && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{errors.student_id.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] font-bold text-slate-900 mb-0.5">
                  {authMessages.passwordLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={authMessages.passwordPlaceholder}
                    className={`appearance-none block w-full pl-9 pr-9 py-1.5 border rounded-xl shadow-xs text-xs font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-[11px] font-bold text-slate-900 mb-0.5">
                  {authMessages.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={authMessages.confirmPasswordPlaceholder}
                    className={`appearance-none block w-full pl-9 pr-9 py-1.5 border rounded-xl shadow-xs text-xs font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.confirm_password
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('confirm_password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full flex justify-center py-2.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md transition-colors text-xs"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? authMessages.submittingRegister : authMessages.submitRegister}
                </Button>
              </div>

              {/* Login Link Prompt */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-600 font-medium">
                  {authMessages.hasAccountPrompt}{' '}
                  <Link to="/login" className="font-bold text-brand-primary hover:underline ml-1">
                    {authMessages.loginNow} →
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
