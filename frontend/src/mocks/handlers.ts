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
];
