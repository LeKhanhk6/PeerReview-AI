export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface AuditLogMetadata {
  old_role?: string;
  new_role?: string;
  old_status?: string;
  new_status?: string;
  target_email?: string;
  [key: string]: unknown;
}

export interface AuditLogItem {
  id: string;
  groupId: string | null;
  userId: string;
  userEmail: string;
  userName: string;
  actionType: string;
  targetId: string;
  metadata: AuditLogMetadata | null;
  contentSummary: string;
  createdAt: string;
}

export interface AuditLogFilters {
  action_type?: string;
  user_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminDashboardOverview {
  users: {
    STUDENT: number;
    TEACHER: number;
    ADMIN: number;
    TOTAL: number;
  };
  activeClasses: number;
  totalSubmissions: number;
  totalReviews: number;
  aiRequests24h: number;
}

export interface UpdateUserRolePayload {
  role: UserRole;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface SystemConfigItem {
  key: string;
  value: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SystemConfigResponse {
  configs: Record<string, string>;
  items: SystemConfigItem[];
}

