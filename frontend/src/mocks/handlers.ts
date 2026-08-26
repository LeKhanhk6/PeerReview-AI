import { http, HttpResponse } from 'msw';

export const handlers = [
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
    // Simulate 401 for testing protected routes if needed, or return a mock user
    // return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({
      success: true,
      data: {
        id: '123',
        email: 'mockuser@example.com',
        full_name: 'Mock User',
        role: 'STUDENT',
      }
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'error@example.com') {
      return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '123',
          email: body.email,
          full_name: 'Mock User',
          role: 'STUDENT',
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
