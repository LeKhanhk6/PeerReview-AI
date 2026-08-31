import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminMessages } from '@/constants/messages/admin';
import { adminApi } from '../api/adminApi';
import type {
  AdminUserFilters,
  AuditLogFilters,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
} from '../types/admin.types';

export const ADMIN_QUERY_KEYS = {
  users: (filters?: AdminUserFilters) => ['admin-users', filters],
  auditLogs: (filters?: AuditLogFilters) => ['admin-audit-logs', filters],
  overview: () => ['admin-dashboard-overview'],
  systemConfig: () => ['admin-system-config'],
};

/**
 * Hook lấy danh sách người dùng phân trang & filter
 */
export const useAdminUsers = (filters?: AdminUserFilters) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.users(filters),
    queryFn: () => adminApi.getUsers(filters),
    staleTime: 1000 * 30, // 30s
  });
};

/**
 * Hook Mutation thay đổi vai trò người dùng (Role)
 */
export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserRolePayload }) =>
      adminApi.updateUserRole(userId, payload),
    onSuccess: () => {
      toast.success(adminMessages.userRoleModal.successToast);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.overview() });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard-overview'] });
    },
    onError: (error: any) => {
      if (error?.status === 409 || error?.code === 'CONFLICT') {
        toast.error(adminMessages.errors.conflict409LastAdmin);
      } else if (error?.status === 403 || error?.code === 'FORBIDDEN') {
        toast.error(adminMessages.errors.forbidden403SelfAction);
      } else {
        toast.error(error?.message || adminMessages.errors.updateRoleError);
      }
    },
  });
};

/**
 * Hook Mutation thay đổi trạng thái tài khoản (Status)
 */
export const useUpdateUserStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserStatusPayload }) =>
      adminApi.updateUserStatus(userId, payload),
    onSuccess: () => {
      toast.success(adminMessages.userStatusModal.successToast);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.overview() });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard-overview'] });
    },
    onError: (error: any) => {
      if (error?.status === 409 || error?.code === 'CONFLICT') {
        toast.error(adminMessages.errors.conflict409LastAdmin);
      } else if (error?.status === 403 || error?.code === 'FORBIDDEN') {
        toast.error(adminMessages.errors.forbidden403SelfAction);
      } else {
        toast.error(error?.message || adminMessages.errors.updateStatusError);
      }
    },
  });
};

/**
 * Hook lấy danh sách Audit Logs Read-only
 */
export const useAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.auditLogs(filters),
    queryFn: () => adminApi.getAuditLogs(filters),
    staleTime: 1000 * 30, // 30s
  });
};

/**
 * Hook lấy dữ liệu thống kê tổng quan Admin Dashboard
 */
export const useAdminDashboardOverview = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.overview(),
    queryFn: () => adminApi.getDashboardOverview(),
    staleTime: 1000 * 60 * 2, // 2 min
  });
};

/**
 * Hook lấy cấu hình hệ thống
 */
export const useSystemConfig = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.systemConfig(),
    queryFn: () => adminApi.getSystemConfig(),
    staleTime: 1000 * 30, // 30s
  });
};

/**
 * Hook Mutation cập nhật cấu hình hệ thống (Multi-key Batch PATCH)
 */
export const useUpdateSystemConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, string>) => adminApi.updateSystemConfig(payload),
    onSuccess: () => {
      toast.success('Đã cập nhật cấu hình hệ thống thành công!');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.systemConfig() });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.overview() });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Không thể cập nhật cấu hình hệ thống');
    },
  });
};
