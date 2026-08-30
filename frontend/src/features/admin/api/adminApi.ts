import { api } from '@/lib/axios';
import type {
  AdminUserItem,
  AdminUserFilters,
  AuditLogItem,
  AuditLogFilters,
  AdminDashboardOverview,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  SystemConfigResponse,
} from '../types/admin.types';

export const adminApi = {
  // 1. Lấy danh sách người dùng phân trang & filter
  getUsers: async (
    params?: AdminUserFilters
  ): Promise<{ users: AdminUserItem[]; total: number; page: number; limit: number; hasNext: boolean }> => {
    const res: any = await api.get('/admin/users', { params });
    const items = Array.isArray(res) ? res : res.data || res.users || [];
    return {
      users: items,
      total: res.pagination?.total ?? res.total ?? items.length,
      page: res.pagination?.page ?? params?.page ?? 1,
      limit: res.pagination?.limit ?? params?.limit ?? 20,
      hasNext: res.pagination?.hasNext ?? res.hasNext ?? false,
    };
  },

  // 2. Thay đổi vai trò người dùng (Role)
  updateUserRole: async (userId: string, payload: UpdateUserRolePayload): Promise<AdminUserItem> => {
    const res: any = await api.patch(`/admin/users/${userId}/role`, payload);
    return res.data || res;
  },

  // 3. Thay đổi trạng thái tài khoản (Status: ACTIVE/LOCKED)
  updateUserStatus: async (userId: string, payload: UpdateUserStatusPayload): Promise<AdminUserItem> => {
    const res: any = await api.patch(`/admin/users/${userId}/status`, payload);
    return res.data || res;
  },

  // 4. Lấy danh sách Audit Logs Read-only
  getAuditLogs: async (
    params?: AuditLogFilters
  ): Promise<{ logs: AuditLogItem[]; total: number; page: number; limit: number; hasNext: boolean }> => {
    const res: any = await api.get('/admin/audit-logs', { params });
    const items = Array.isArray(res) ? res : res.data || res.logs || [];
    return {
      logs: items,
      total: res.pagination?.total ?? res.total ?? items.length,
      page: res.pagination?.page ?? params?.page ?? 1,
      limit: res.pagination?.limit ?? params?.limit ?? 20,
      hasNext: res.pagination?.hasNext ?? res.hasNext ?? false,
    };
  },

  // 5. Lấy chỉ số tổng quan Admin Dashboard Overview
  getDashboardOverview: async (): Promise<AdminDashboardOverview> => {
    const res: any = await api.get('/admin/dashboard/overview');
    return res.data || res;
  },

  // 6. Lấy danh sách cấu hình hệ thống
  getSystemConfig: async (): Promise<SystemConfigResponse> => {
    const res: any = await api.get('/admin/system-config');
    const configs = res?.configs || res?.data?.configs || (typeof res === 'object' && !res.configs && !res.data ? res : {});
    const items = res?.items || res?.data?.items || [];
    return {
      configs,
      items,
    };
  },

  // 7. Cập nhật tham số cấu hình hệ thống (Multi-key Batch PATCH)
  updateSystemConfig: async (payload: Record<string, string>): Promise<SystemConfigResponse> => {
    const res: any = await api.patch('/admin/system-config', payload);
    const configs = res?.configs || res?.data?.configs || (typeof res === 'object' && !res.configs && !res.data ? res : {});
    const items = res?.items || res?.data?.items || [];
    return {
      configs,
      items,
    };
  },
};

