import { http, HttpResponse } from 'msw';
import { assignmentHandlers } from './handlers/assignment.handlers';
import { analyticsHandlers } from './handlers/analytics.handlers';
import { workspaceHandlers } from './handlers/workspace.handlers';
import { submissionHandlers } from './handlers/submission.handlers';
import { synthesisHandlers } from './handlers/synthesis.handlers';
import { adminHandlers } from './handlers/admin.handlers';
import { groupsHandlers } from './handlers/groups.handlers';
import { reviewHandlers } from './handlers/review.handlers';

export const handlers = [
  ...assignmentHandlers,
  ...analyticsHandlers,
  ...workspaceHandlers,
  ...submissionHandlers,
  ...synthesisHandlers,
  ...adminHandlers,
  ...groupsHandlers,
  ...reviewHandlers,


  // Mocks for Telemetry and Observability (Always return success to prevent console spam)
  http.post('/api/telemetry', () => {
    return HttpResponse.json({ success: true, message: 'Telemetry logged successfully (Mocked)' });
  }),


  http.post('/api/client-errors', () => {
    return HttpResponse.json({ success: true, message: 'Client error logged successfully (Mocked)' });
  }),

  // Mock for Health Check
  http.get('/api/health', () => {
    return HttpResponse.json({
      data: { status: 'ok', message: 'PeerReview-AI Backend is running! (Mocked)' }
    });
  }),

  // Auth Mocks
  http.get('/api/auth/me', () => {
    // Check session storage for mock scenarios
    const auditEnabledStr = sessionStorage.getItem('MSW_AUDIT_ENABLED');
    const auditEnabled = auditEnabledStr === 'false' ? false : true;
    
    // Simulate loading if requested
    if (sessionStorage.getItem('MSW_LOADING') === 'true') {
      return new Promise(() => {}); // Never resolves
    }

    const role = sessionStorage.getItem('MSW_ROLE');
    if (!role) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '123',
          email: 'mockuser@example.com',
          full_name: 'Mock User',
          role: role,
          capabilities: {
            audit_enabled: auditEnabled
          }
        }
      }
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'error@example.com') {
      return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    let role = 'STUDENT';
    if (body.email.includes('admin')) role = 'ADMIN';
    if (body.email.includes('teacher')) role = 'TEACHER';

    sessionStorage.setItem('MSW_ROLE', role);

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '123',
          email: body.email,
          full_name: 'Mock User',
          role: role,
          capabilities: {
            audit_enabled: true
          }
        }
      }
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({ success: true, message: 'User registered' });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.patch('/api/auth/profile', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.avatar_url && !body.avatar_url.startsWith('https://')) {
      return HttpResponse.json({ success: false, message: 'avatar_url must start with https://' }, { status: 400 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '123',
          email: 'mockuser@example.com',
          full_name: body.full_name || 'Mock User',
          avatar_url: body.avatar_url,
          role: sessionStorage.getItem('MSW_ROLE') || 'STUDENT',
          student_id: 'SV99999',
        },
      },
    });
  }),

  http.post('/api/auth/change-password', async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body || (body.current_password !== 'password123' && body.current_password !== 'correct_current')) {
      return HttpResponse.json({ success: false, message: 'Mật khẩu hiện tại không đúng' }, { status: 401 });
    }
    return HttpResponse.json({ success: true, message: 'Password updated successfully' });
  }),


  // Error-State Test Handlers for Task 08.2 Quality Gate
  http.post('/api/test/error-429', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Bạn đã vượt quá giới hạn lượt sử dụng AI Mentor (tối đa 30 lượt/phút). Vui lòng thử lại sau.',
        },
      },
      { status: 429 }
    );
  }),

  http.post('/api/test/error-409', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Không thể khóa hoặc hạ quyền Admin duy nhất cuối cùng trong hệ thống.',
        },
      },
      { status: 409 }
    );
  }),

  http.post('/api/test/error-403', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền thực thi thao tác này.',
        },
      },
      { status: 403 }
    );
  }),

  http.post('/api/test/error-500', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Máy chủ gặp sự cố nội bộ. Vui lòng thử lại sau.',
        },
      },
      { status: 500 }
    );
  }),
];

