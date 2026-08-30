import { http, HttpResponse } from 'msw';
import { assignmentHandlers } from './handlers/assignment.handlers';
import { analyticsHandlers } from './handlers/analytics.handlers';
import { workspaceHandlers } from './handlers/workspace.handlers';
import { submissionHandlers } from './handlers/submission.handlers';
import { synthesisHandlers } from './handlers/synthesis.handlers';
import { adminHandlers } from './handlers/admin.handlers';

export const handlers = [
  ...assignmentHandlers,
  ...analyticsHandlers,
  ...workspaceHandlers,
  ...submissionHandlers,
  ...synthesisHandlers,
  ...adminHandlers,


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

    const role = sessionStorage.getItem('MSW_ROLE') || 'STUDENT';

    return HttpResponse.json({
      success: true,
      data: {
        id: '123',
        email: 'mockuser@example.com',
        full_name: 'Mock User',
        role: role,
        capabilities: {
          audit_enabled: auditEnabled
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
];
