import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updateProfileApi, changePasswordApi } from '../api/auth.api';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { User, Lock, AlertTriangle, Lightbulb } from 'lucide-react';


export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 1. Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }

    if (avatarUrl.trim() && !avatarUrl.trim().startsWith('https://')) {
      setProfileError('URL ảnh đại diện phải bắt đầu bằng https://');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      setAvatarLoadError(false);
      const res = await updateProfileApi({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });

      updateUser(res.user);
      toast.success('Đã cập nhật thông tin cá nhân thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật thông tin';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 2. Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
      
      // Auto logout & redirect to login on successful password change
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      const status = err.response?.status || err.status;
      const msg = err.response?.data?.message || err.message || 'Không thể đổi mật khẩu';

      if (status === 401) {
        setPasswordError('Mật khẩu hiện tại không đúng');
      } else {
        setPasswordError(msg);
      }
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isStudent = user?.role === 'STUDENT';
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Quản trị viên'
      : user?.role === 'TEACHER'
      ? 'Giảng viên'
      : 'Sinh viên';

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto p-6 max-w-5xl mx-auto space-y-8 bg-slate-50/50 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0">
          {user?.avatar_url && !avatarLoadError ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full object-cover"
              onError={() => setAvatarLoadError(true)}
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user?.full_name}
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              {roleLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối 1: Thông tin cá nhân */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-brand-primary" /> Thông tin cá nhân
          </h2>

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email <span className="text-slate-400 font-normal">(Không thể thay đổi)</span>
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-100/70 cursor-not-allowed shadow-none"
              />
            </div>

            {/* Render MSSV CHỈ KHI ROLE LÀ STUDENT (Ẩn đối với Teacher & Admin) */}
            {isStudent && (
              <div>
                <label htmlFor="student-id" className="block text-xs font-bold text-slate-700 mb-1">
                  Mã số sinh viên (MSSV) <span className="text-slate-400 font-normal">(Do hệ thống quản lý)</span>
                </label>
                <input
                  id="student-id"
                  type="text"
                  value={user?.student_id || 'Chưa cập nhật'}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-100/70 cursor-not-allowed shadow-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="avatar-url" className="block text-xs font-bold text-slate-700 mb-1">
                Link ảnh đại diện (Avatar URL)
              </label>
              <input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Yêu cầu URL sử dụng giao thức an toàn HTTPS (https://...)
              </p>
            </div>

            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isUpdatingProfile}
              className="w-full justify-center mt-2"
            >
              Lưu thay đổi hồ sơ
            </Button>
          </form>
        </div>

        {/* Khối 2: Đổi mật khẩu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-brand-primary" /> Đổi mật khẩu & Bảo mật
          </h2>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl flex items-start gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> <span><strong>Lưu ý:</strong> Sau khi đổi mật khẩu thành công, bạn sẽ được tự động đăng xuất để đăng nhập lại với mật khẩu mới.</span>
            </p>

            <Button
              type="submit"
              variant="outline"
              size="sm"
              isLoading={isChangingPassword}
              className="w-full justify-center text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 mt-2"
            >
              Cập nhật mật khẩu mới
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
