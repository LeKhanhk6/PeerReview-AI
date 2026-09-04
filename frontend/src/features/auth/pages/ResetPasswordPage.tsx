import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { resetPasswordApi } from '../api/auth.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { AuthIllustrationPanel } from '../components/AuthIllustrationPanel';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Đường dẫn không hợp lệ hoặc đã hết hạn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi({ token, password: data.password });
      toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* 2-Column Split-Screen Container */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl w-full flex flex-col md:flex-row border border-slate-100/80 my-auto">
        
        {/* LEFT COLUMN: Shared Brand Hero Panel */}
        <AuthIllustrationPanel
          title="Thiết Lập Mật Khẩu Mới"
          subtitle="Hãy tạo một mật khẩu mạnh mẽ để bảo vệ tài khoản PeerReview-AI của bạn."
        />

        {/* RIGHT COLUMN: Form Panel */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 lg:p-7 flex flex-col justify-center bg-white">
          <div className="space-y-3.5">
            {/* Header */}
            <div>
              <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Tạo mật khẩu mới
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Vui lòng nhập mật khẩu mới và xác nhận bên dưới.
              </p>
            </div>

            {!token && (
              <div role="alert" className="p-2.5 bg-badge-danger-bg border border-badge-danger-border rounded-xl text-xs font-semibold text-badge-danger-text flex items-start gap-2 shadow-xs">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Token không hợp lệ. Vui lòng kiểm tra lại liên kết trong email của bạn.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-900 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-900 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu mới"
                    className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                      errors.confirmPassword
                        ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full flex justify-center py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md transition-colors text-sm mt-4"
                isLoading={isSubmitting}
                disabled={!token}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
