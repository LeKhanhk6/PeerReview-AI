import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/features/auth/store/authStore';
import { adminMessages } from '@/constants/messages/admin';
import type { AdminUserItem, UserRole, UserStatus } from '../types/admin.types';

interface UserTableProps {
  users: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  isLoading: boolean;
  searchTerm: string;
  selectedRole: string;
  selectedStatus: string;
  onSearchChange: (search: string) => void;
  onRoleFilterChange: (role: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (newPage: number) => void;
  onOpenRoleModal: (user: AdminUserItem) => void;
  onToggleUserStatus: (userId: string, newStatus: UserStatus) => Promise<void>;
}

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="px-2.5 py-0.5 text-xs font-black bg-purple-100 text-purple-800 rounded-full border border-purple-200">
          👑 {adminMessages.roles.ADMIN}
        </span>
      );
    case 'TEACHER':
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
          🎓 {adminMessages.roles.TEACHER}
        </span>
      );
    case 'STUDENT':
    default:
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
          📘 {adminMessages.roles.STUDENT}
        </span>
      );
  }
};

const getStatusBadge = (status: UserStatus) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
          ✓ {adminMessages.status.ACTIVE}
        </span>
      );
    case 'LOCKED':
    case 'INACTIVE':
    default:
      return (
        <span className="px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700 rounded border border-red-200">
          🔒 {adminMessages.status.LOCKED}
        </span>
      );
  }
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  total,
  page,
  limit,
  hasNext,
  isLoading,
  searchTerm,
  selectedRole,
  selectedStatus,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onOpenRoleModal,
  onToggleUserStatus,
}) => {
  const currentLoggedInUser = useAuthStore((state) => state.user);

  const [statusTargetUser, setStatusTargetUser] = useState<AdminUserItem | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleConfirmStatusToggle = async () => {
    if (!statusTargetUser) return;
    const nextStatus: UserStatus = statusTargetUser.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setStatusTargetUser(null);
    await onToggleUserStatus(statusTargetUser.id, nextStatus);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        {/* Search Input */}
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={adminMessages.usersTable.searchPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{adminMessages.usersTable.filterAllRoles}</option>
            <option value="STUDENT">{adminMessages.roles.STUDENT}</option>
            <option value="TEACHER">{adminMessages.roles.TEACHER}</option>
            <option value="ADMIN">{adminMessages.roles.ADMIN}</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{adminMessages.usersTable.filterAllStatus}</option>
            <option value="ACTIVE">{adminMessages.status.ACTIVE}</option>
            <option value="LOCKED">{adminMessages.status.LOCKED}</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      {isLoading ? (
        <div className="space-y-3 py-4" aria-busy="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : users.length === 0 ? (
        <div className="py-8">
          <EmptyState
            type="no_data"
            title={adminMessages.usersTable.emptyUsersTitle}
            description={adminMessages.usersTable.emptyUsersDesc}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <th className="py-3 px-4">{adminMessages.usersTable.colName}</th>
                <th className="py-3 px-4">{adminMessages.usersTable.colEmail}</th>
                <th className="py-3 px-4">{adminMessages.usersTable.colRole}</th>
                <th className="py-3 px-4">{adminMessages.usersTable.colStatus}</th>
                <th className="py-3 px-4">{adminMessages.usersTable.colCreatedAt}</th>
                <th className="py-3 px-4 text-right">{adminMessages.usersTable.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = String(user.id) === String(currentLoggedInUser?.id);

                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      {user.fullName}
                      {isSelf && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">
                          Tôi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">{user.email}</td>
                    <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Change Role Button */}
                        <div className="relative group">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => onOpenRoleModal(user)}
                            className="text-xs"
                          >
                            ✏️ {adminMessages.usersTable.changeRoleBtn}
                          </Button>
                          {isSelf && (
                            <span className="absolute right-0 -bottom-8 hidden group-hover:block z-10 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                              {adminMessages.usersTable.selfProtectionTooltip}
                            </span>
                          )}
                        </div>

                        {/* Toggle Status Button */}
                        <div className="relative group">
                          <Button
                            type="button"
                            variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setStatusTargetUser(user)}
                            className="text-xs"
                          >
                            {user.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở khóa'}
                          </Button>
                          {isSelf && (
                            <span className="absolute right-0 -bottom-8 hidden group-hover:block z-10 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                              {adminMessages.usersTable.selfProtectionTooltip}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>
          Trang <strong>{page}</strong> / {totalPages} (Tổng {total} người dùng)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="text-xs"
          >
            Trang trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNext || page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="text-xs"
          >
            Trang sau
          </Button>
        </div>
      </div>

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(statusTargetUser)}
        onClose={() => setStatusTargetUser(null)}
        onConfirm={handleConfirmStatusToggle}
        title={
          statusTargetUser?.status === 'ACTIVE'
            ? adminMessages.userStatusModal.confirmLockTitle
            : adminMessages.userStatusModal.confirmUnlockTitle
        }
        description={
          statusTargetUser?.status === 'ACTIVE'
            ? adminMessages.userStatusModal.confirmLockDesc
            : adminMessages.userStatusModal.confirmUnlockDesc
        }
        isDestructive={statusTargetUser?.status === 'ACTIVE'}
      />
    </div>
  );
};
