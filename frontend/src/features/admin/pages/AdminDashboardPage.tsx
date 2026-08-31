import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminMessages } from '@/constants/messages/admin';
import { useAdminDashboardOverview } from '../hooks/useAdmin';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: overview, isLoading, isError, refetch } = useAdminDashboardOverview();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50 flex items-center justify-center">
        <EmptyState
          type="error"
          title={adminMessages.errors.fetchOverviewError}
          description="Không thể tải chỉ số thống kê tổng quan hệ thống. Vui lòng kiểm tra kết nối và thử lại."
          actionLabel="Tải lại trang"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {adminMessages.header.dashboardTitle}
            </h1>
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              ⚡ ADMIN MODE
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Xin chào, {user?.full_name || 'Quản trị viên'} — {adminMessages.header.dashboardSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            🔄 Cập nhật dữ liệu
          </Button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>👥 {adminMessages.dashboard.totalUsersCard}</span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              Toàn hệ thống
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {overview?.users?.TOTAL ?? 0}
          </p>
          <div className="text-xs text-slate-600 pt-2.5 border-t border-slate-100 flex justify-between">
            <span>📘 SV: <strong>{overview?.users?.STUDENT ?? 0}</strong></span>
            <span>🎓 GV: <strong>{overview?.users?.TEACHER ?? 0}</strong></span>
            <span>👑 AD: <strong>{overview?.users?.ADMIN ?? 0}</strong></span>
          </div>
        </div>

        {/* Active Classes Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>🏫 {adminMessages.dashboard.activeClassesCard}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              Active
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {overview.activeClasses}
          </p>
          <p className="text-xs text-slate-500 pt-2.5 border-t border-slate-100">
            Lớp học đang diễn ra trong học kỳ
          </p>
        </div>

        {/* Total Submissions Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>📂 {adminMessages.dashboard.totalSubmissionsCard}</span>
            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              Submissions
            </span>
          </div>
          <p className="text-3xl font-extrabold text-purple-600 tracking-tight">
            {overview.totalSubmissions}
          </p>
          <p className="text-xs text-slate-500 pt-2.5 border-t border-slate-100">
            Tổng bài nộp bài tập sinh viên
          </p>
        </div>

        {/* AI Requests Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-200 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>🤖 {adminMessages.dashboard.aiRequests24hCard}</span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              24h qua
            </span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {overview.aiRequests24h}
          </p>
          <p className="text-xs text-slate-500 pt-2.5 border-t border-slate-100">
            Yêu cầu AI Mentor & Synthesis
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Management Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>👥</span> Quản lý người dùng
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xem danh sách tài khoản, thay đổi vai trò (Role STUDENT / TEACHER / ADMIN) và quản lý khóa/mở tài khoản.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full justify-center mt-2"
            onClick={() => navigate('/admin/users')}
          >
            Mở Quản lý Người dùng →
          </Button>
        </div>

        {/* Audit Logs Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📋</span> Nhật ký vết hoạt động
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xem lịch sử thao tác hệ thống Read-only, PII masked metadata JSON và lọc theo loại hành động tác động.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center mt-2"
            onClick={() => navigate('/admin/audit-logs')}
          >
            Mở Xem Audit Logs →
          </Button>
        </div>

        {/* System Settings Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-200 transition-all">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⚙️</span> Cấu hình & Giám sát hệ thống
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Giám sát tham số cấu hình hệ thống, trạng thái telemetry, audit logging flags và giới hạn tần suất (Rate Limiting).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center mt-2"
            onClick={() => navigate('/admin/settings')}
          >
            Xem Cấu hình Hệ thống →
          </Button>
        </div>
      </div>
    </div>
  );
};

