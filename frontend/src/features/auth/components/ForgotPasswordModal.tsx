import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { forgotPasswordApi } from '../api/auth.api';
import { toast } from 'sonner';
import { authMessages } from '@/constants/messages/auth';
import { Key, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(authMessages.emailInvalid);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      toast.success(res.message || 'Đã gửi hướng dẫn khôi phục mật khẩu tới Email của bạn.');
      setEmail('');
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể yêu cầu đặt lại mật khẩu.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-soft-bg text-brand-primary text-lg flex items-center justify-center">
              <Key size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Quên mật khẩu</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Nhập địa chỉ Email liên kết với tài khoản của bạn. Hệ thống sẽ gửi đường dẫn khôi phục mật khẩu qua Email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1">
              {authMessages.emailLabel}
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={authMessages.emailPlaceholder}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 border-slate-200"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isSubmitting}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
