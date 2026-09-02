import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminMessages } from '@/constants/messages/admin';
import { useAdminDashboardOverview } from '../hooks/useAdmin';
import { Zap, RefreshCcw, Users, Book, GraduationCap, Crown, School, FolderOpen, Bot, Settings, ClipboardList } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: overview, isLoading, isError, refetch } = useAdminDashboardOverview();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <EmptyState
        type="error"
        title={adminMessages.errors.fetchOverviewError}
        description="Không thể tải chỉ số thống kê tổng quan hệ thống. Vui lòng kiểm tra kết nối và thử lại."
        actionLabel="Tải lại trang"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {adminMessages.header.dashboardTitle}
              </h1>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                <Zap className="w-3 h-3" /> ADMIN MODE
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> API Online
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500">
              Xin chào, {user?.full_name || 'Quản trị viên'} — {adminMessages.header.dashboardSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
              onClick={() => refetch()}
            >
              <RefreshCcw className="w-3 h-3" /> Cập nhật dữ liệu
            </Button>
          </div>
        </div>

        {/* Overview Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Total Users Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 hover:border-brand-primary/20 transition-all group">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 group-hover:text-brand-primary transition-colors">
                <Users className="w-4 h-4" /> {adminMessages.dashboard.totalUsersCard}
              </span>
              <span className="text-brand-primary bg-brand-soft-bg px-2 py-0.5 rounded font-semibold text-[10px]">
                Toàn hệ thống
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {overview?.users?.TOTAL ?? 0}
            </p>
            <div className="text-xs text-slate-600 pt-3 border-t border-slate-100 flex justify-between">
              <span className="flex items-center gap-1"><Book className="w-3 h-3 text-slate-400" /> SV: <strong>{overview?.users?.STUDENT ?? 0}</strong></span>
              <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-emerald-500" /> GV: <strong>{overview?.users?.TEACHER ?? 0}</strong></span>
              <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-rose-500" /> AD: <strong>{overview?.users?.ADMIN ?? 0}</strong></span>
            </div>
          </div>

          {/* Active Classes Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 hover:border-emerald-500/20 transition-all group">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors">
                <School className="w-4 h-4" /> {adminMessages.dashboard.activeClassesCard}
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                Active
              </span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {overview.activeClasses}
            </p>
            <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
              Lớp học đang diễn ra trong học kỳ
            </p>
          </div>

          {/* Total Submissions Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 hover:border-brand-primary/20 transition-all group">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 group-hover:text-brand-primary transition-colors">
                <FolderOpen className="w-4 h-4" /> {adminMessages.dashboard.totalSubmissionsCard}
              </span>
              <span className="text-brand-primary bg-brand-soft-bg px-2 py-0.5 rounded font-semibold text-[10px]">
                Submissions
              </span>
            </div>
            <p className="text-2xl font-extrabold text-brand-primary tracking-tight">
              {overview.totalSubmissions}
            </p>
            <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
              Tổng bài nộp bài tập sinh viên
            </p>
          </div>

          {/* AI Requests Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 hover:border-amber-500/20 transition-all group">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5 group-hover:text-amber-600 transition-colors">
                <Bot className="w-4 h-4" /> {adminMessages.dashboard.aiRequests24hCard}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                24h qua
              </span>
            </div>
            <p className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {overview.aiRequests24h}
            </p>
            <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
              Yêu cầu AI Mentor & Synthesis
            </p>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* User Management Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-primary" /> Quản lý người dùng
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xem danh sách tài khoản, thay đổi vai trò (Role STUDENT / TEACHER / ADMIN) và quản lý khóa/mở tài khoản.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full justify-center mt-2 text-xs px-3 py-1.5"
              onClick={() => navigate('/admin/users')}
            >
              Mở Quản lý Người dùng →
            </Button>
          </div>

          {/* Audit Logs Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-primary" /> Nhật ký vết hoạt động
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xem lịch sử thao tác hệ thống Read-only, PII masked metadata JSON và lọc theo loại hành động tác động.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center mt-2 text-xs px-3 py-1.5"
              onClick={() => navigate('/admin/audit-logs')}
            >
              Mở Xem Audit Logs →
            </Button>
          </div>

          {/* System Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-primary" /> Cấu hình & Giám sát hệ thống
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Giám sát tham số cấu hình hệ thống, trạng thái telemetry, audit logging flags và giới hạn tần suất (Rate Limiting).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center mt-2 text-xs px-3 py-1.5"
              onClick={() => navigate('/admin/settings')}
            >
              Xem Cấu hình Hệ thống →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
