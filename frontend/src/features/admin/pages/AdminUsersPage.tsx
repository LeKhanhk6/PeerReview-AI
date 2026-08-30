import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminMessages } from '@/constants/messages/admin';
import {
  useAdminUsers,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from '../hooks/useAdmin';
import { UserTable } from '../components/UserTable';
import { UserRoleModal } from '../components/UserRoleModal';
import type { AdminUserItem, UserRole, UserStatus } from '../types/admin.types';

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected User for Role Modal
  const [roleModalUser, setRoleModalUser] = useState<AdminUserItem | null>(null);

  // Sync state with URL SearchParams
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Queries & Mutations
  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: (role as any) || undefined,
    status: (status as any) || undefined,
    page,
    limit: 20,
  });

  const updateRoleMutation = useUpdateUserRoleMutation();
  const updateStatusMutation = useUpdateUserStatusMutation();

  const users = data?.users || [];
  const total = data?.total || 0;
  const hasNext = data?.hasNext || false;

  const updateUrlParams = (newParams: Record<string, string | number | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== '' && val !== 1) {
        nextParams.set(key, String(val));
      } else if (val === 1 && key === 'page') {
        nextParams.delete('page');
      } else {
        nextParams.delete(key);
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchChange = (newSearch: string) => {
    updateUrlParams({ search: newSearch, page: 1 });
  };

  const handleRoleFilterChange = (newRole: string) => {
    updateUrlParams({ role: newRole, page: 1 });
  };

  const handleStatusFilterChange = (newStatus: string) => {
    updateUrlParams({ status: newStatus, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handleConfirmRoleChange = async (userId: string, newRole: UserRole) => {
    await updateRoleMutation.mutateAsync({ userId, payload: { role: newRole } });
  };

  const handleConfirmStatusToggle = async (userId: string, newStatus: UserStatus) => {
    await updateStatusMutation.mutateAsync({ userId, payload: { status: newStatus } });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {adminMessages.header.usersTitle}
        </h1>
        <p className="text-sm text-gray-600">{adminMessages.header.usersSubtitle}</p>
      </div>

      {/* Main User Table Component */}
      <UserTable
        users={users}
        total={total}
        page={page}
        limit={20}
        hasNext={hasNext}
        isLoading={isLoading}
        searchTerm={search}
        selectedRole={role}
        selectedStatus={status}
        onSearchChange={handleSearchChange}
        onRoleFilterChange={handleRoleFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onPageChange={handlePageChange}
        onOpenRoleModal={(user) => setRoleModalUser(user)}
        onToggleUserStatus={handleConfirmStatusToggle}
      />

      {/* Role Change Modal */}
      <UserRoleModal
        user={roleModalUser}
        isOpen={Boolean(roleModalUser)}
        isUpdating={updateRoleMutation.isPending}
        onClose={() => setRoleModalUser(null)}
        onConfirmRoleChange={handleConfirmRoleChange}
      />
    </div>
  );
};
