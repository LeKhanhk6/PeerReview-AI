import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminMessages } from '@/constants/messages/admin';
import { useAdminDashboardOverview } from '../hooks/useAdmin';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading, isError, refetch } = useAdminDashboardOverview();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {adminMessages.header.dashboardTitle}
        </h1>
        <p className="text-sm text-gray-600">{adminMessages.header.dashboardSubtitle}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError || !overview ? (
        <EmptyState
          type="error"
          title={adminMessages.errors.fetchOverviewError}
          description="Không thể tải chỉ số thống kê tổng quan. Vui lòng thử lại."
          actionLabel="Tải lại trang"
          onAction={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          {/* Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>👥 {adminMessages.dashboard.totalUsersCard}</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Toàn hệ thống</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{overview.users.TOTAL}</p>
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex justify-between">
                <span>📘 SV: <strong>{overview.users.STUDENT}</strong></span>
                <span>🎓 GV: <strong>{overview.users.TEACHER}</strong></span>
                <span>👑 AD: <strong>{overview.users.ADMIN}</strong></span>
              </div>
            </div>

            {/* Active Classes Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>🏫 {adminMessages.dashboard.activeClassesCard}</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600">{overview.activeClasses}</p>
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Lớp học đang diễn ra trong học kỳ
              </p>
            </div>

            {/* Total Submissions Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>📂 {adminMessages.dashboard.totalSubmissionsCard}</span>
                <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Submissions</span>
              </div>
              <p className="text-3xl font-extrabold text-purple-600">{overview.totalSubmissions}</p>
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Tổng bài nộp bài tập sinh viên
              </p>
            </div>

            {/* AI Requests Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>🤖 {adminMessages.dashboard.aiRequests24hCard}</span>
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">24h qua</span>
              </div>
              <p className="text-3xl font-extrabold text-amber-600">{overview.aiRequests24h}</p>
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Yêu cầu AI Mentor & Synthesis
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900">👥 Quản lý người dùng</h3>
              <p className="text-xs text-gray-600">
                Xem danh sách tài khoản, thay đổi vai trò (Role STUDENT / TEACHER / ADMIN) và quản lý khóa/mở tài khoản.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => navigate('/admin/users')}
              >
                Mở Quản lý Người dùng →
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900">📋 Nhật ký vết hoạt động</h3>
              <p className="text-xs text-gray-600">
                Xem lịch sử thao tác hệ thống Read-only, PII masked metadata JSON và lọc theo loại hành động.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/audit-logs')}
              >
                Mở Xem Audit Logs →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
