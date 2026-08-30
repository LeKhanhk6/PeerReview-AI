import { http, HttpResponse } from 'msw';
import type {
  AdminUserItem,
  AuditLogItem,
  AdminDashboardOverview,
  UserRole,
  UserStatus,
} from '@/features/admin/types/admin.types';

// Mock DB State
let mockUsers: AdminUserItem[] = [
  {
    id: 'usr-uuid-001',
    email: 't***@university.edu.vn',
    fullName: 'Giáo viên Nguyễn Văn A',
    role: 'TEACHER',
    status: 'ACTIVE',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'usr-uuid-002',
    email: 's***@university.edu.vn',
    fullName: 'Sinh viên Trần Văn B',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-21T09:30:00.000Z',
    updatedAt: '2026-08-21T09:30:00.000Z',
  },
  {
    id: 'usr-uuid-003',
    email: 'a***@university.edu.vn',
    fullName: 'Admin Quản trị Hệ thống',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'usr-uuid-004',
    email: 's***@university.edu.vn',
    fullName: 'Sinh viên Lê Thị C',
    role: 'STUDENT',
    status: 'LOCKED',
    createdAt: '2026-08-22T14:00:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z',
  },
];

let mockAuditLogs: AuditLogItem[] = [
  {
    id: 'log-uuid-101',
    groupId: null,
    userId: 'usr-uuid-003',
    userEmail: 'a***@university.edu.vn',
    userName: 'Admin Quản trị Hệ thống',
    actionType: 'ADMIN_UPDATE_ROLE',
    targetId: 'usr-uuid-002',
    metadata: {
      old_role: 'STUDENT',
      new_role: 'TEACHER',
      target_email: 's***@university.edu.vn',
    },
    contentSummary: 'Admin updated user s***@university.edu.vn role to TEACHER',
    createdAt: '2026-08-30T10:15:00.000Z',
  },
  {
    id: 'log-uuid-102',
    groupId: null,
    userId: 'usr-uuid-003',
    userEmail: 'a***@university.edu.vn',
    userName: 'Admin Quản trị Hệ thống',
    actionType: 'ADMIN_UPDATE_STATUS',
    targetId: 'usr-uuid-004',
    metadata: {
      old_status: 'ACTIVE',
      new_status: 'LOCKED',
      target_email: 's***@university.edu.vn',
    },
    contentSummary: 'Admin updated user s***@university.edu.vn status to LOCKED',
    createdAt: '2026-08-28T16:00:00.000Z',
  },
];

export const adminHandlers = [
  // 1. GET /api/admin/users
  http.get('/api/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = [...mockUsers];

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      );
    }
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < filtered.length;

    return HttpResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        hasNext,
      },
    });
  }),

  // 2. PATCH /api/admin/users/:userId/role
  http.patch('/api/admin/users/:userId/role', async ({ params, request }) => {
    const { userId } = params;
    const body = (await request.json()) as { role: UserRole };

    // Simulate 403 Forbidden for self-demotion
    if (userId === 'usr-uuid-003' && body.role !== 'ADMIN') {
      return HttpResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Forbidden: ADMIN cannot demote or change their own role',
        },
        { status: 403 }
      );
    }

    // Simulate 409 Conflict if demoting last admin
    if (userId === 'last-admin-id') {
      return HttpResponse.json(
        {
          success: false,
          code: 'CONFLICT',
          message: 'Conflict: Cannot demote the last remaining active ADMIN in the system',
        },
        { status: 409 }
      );
    }

    const targetUser = mockUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return HttpResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    targetUser.role = body.role;
    targetUser.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: targetUser,
    });
  }),

  // 3. PATCH /api/admin/users/:userId/status
  http.patch('/api/admin/users/:userId/status', async ({ params, request }) => {
    const { userId } = params;
    const body = (await request.json()) as { status: UserStatus };

    // Simulate 403 Forbidden for self-lock
    if (userId === 'usr-uuid-003') {
      return HttpResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Forbidden: ADMIN cannot lock or disable their own account',
        },
        { status: 403 }
      );
    }

    const targetUser = mockUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return HttpResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    targetUser.status = body.status;
    targetUser.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: targetUser,
    });
  }),

  // 4. GET /api/admin/audit-logs
  http.get('/api/admin/audit-logs', ({ request }) => {
    const url = new URL(request.url);
    const actionType = url.searchParams.get('action_type');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = [...mockAuditLogs];

    if (actionType) {
      filtered = filtered.filter((l) => l.actionType === actionType);
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    const hasNext = startIndex + limit < filtered.length;

    return HttpResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        hasNext,
      },
    });
  }),

  // 5. GET /api/admin/dashboard/overview
  http.get('/api/admin/dashboard/overview', () => {
    const overview: AdminDashboardOverview = {
      users: {
        STUDENT: 350,
        TEACHER: 25,
        ADMIN: 3,
        TOTAL: 378,
      },
      activeClasses: 12,
      totalSubmissions: 1280,
      totalReviews: 3450,
      aiRequests24h: 412,
    };

    return HttpResponse.json({
      success: true,
      data: overview,
    });
  }),
];
