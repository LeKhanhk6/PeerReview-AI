import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/features/auth/store/authStore';
import { adminMessages } from '@/constants/messages/admin';
import type { AdminUserItem, UserRole, UserStatus } from '../types/admin.types';
import { Crown, GraduationCap, Book, Check, Lock, Unlock, Edit2 } from 'lucide-react';

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200">
          <Crown className="w-3.5 h-3.5" /> {adminMessages.roles.ADMIN}
        </span>
      );
    case 'TEACHER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          <GraduationCap className="w-3.5 h-3.5" /> {adminMessages.roles.TEACHER}
        </span>
      );
    case 'STUDENT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          <Book className="w-3.5 h-3.5" /> {adminMessages.roles.STUDENT}
        </span>
      );
  }
};

const getStatusBadge = (status: UserStatus) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 shrink-0">
          <Check className="w-3 h-3" /> {adminMessages.status.ACTIVE}
        </span>
      );
    case 'LOCKED':
    case 'INACTIVE':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200 shrink-0">
          <Lock className="w-3 h-3" /> {adminMessages.status.LOCKED}
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
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] max-w-xl">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={adminMessages.usersTable.searchPlaceholder}
            className="w-full h-10 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-3 py-2 h-10 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
            className="px-3 py-2 h-10 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">{adminMessages.usersTable.filterAllStatus}</option>
            <option value="ACTIVE">{adminMessages.status.ACTIVE}</option>
            <option value="LOCKED">{adminMessages.status.LOCKED}</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      {isLoading ? (
        <div className="py-4 w-full" aria-busy="true">
          <SkeletonTable rows={5} />
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
        <div className="w-full overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                const isSelf = Boolean(
                  user.id &&
                  currentLoggedInUser?.id &&
                  String(user.id) === String(currentLoggedInUser?.id)
                );

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {user.fullName}
                      {isSelf && (
                        <span className="text-[10px] bg-brand-soft-bg text-brand-primary px-1.5 py-0.5 rounded font-black shrink-0">
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
                            className="text-xs gap-1.5 shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> {adminMessages.usersTable.changeRoleBtn}
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
                            className="text-xs gap-1.5 shrink-0"
                          >
                            {user.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />} 
                            {user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
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
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 text-xs text-slate-500 shrink-0">
        <span>
          {totalPages > 1 ? (
            <>Trang <strong>{page}</strong> / {totalPages} (Tổng {total} người dùng)</>
          ) : (
            <>Tổng {total} người dùng</>
          )}
        </span>
        {totalPages > 1 && (
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
        )}
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
