import { jest } from '@jest/globals';

describe('email.service', () => {
  const originalEnv = process.env;
  let emailService;
  let originalFetch;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.RESEND_FROM;

    originalFetch = global.fetch;
    emailService = await import('../../src/services/email.service.js');
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  describe('sendMail', () => {
    it('should send email using Resend API when RESEND_API_KEY is configured', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.RESEND_FROM = 'PeerReview-AI <onboarding@resend.dev>';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'resend-msg-123' }),
      });
      global.fetch = mockFetch;

      const result = await emailService.sendMail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer re_test_key_123',
          }),
        })
      );
      expect(result).toEqual({ messageId: 'resend-msg-123' });
    });

    it('should fallback to dev simulator when no email configuration is present', async () => {
      const result = await emailService.sendMail({
        to: 'user@example.com',
        subject: 'Dev Test',
        html: '<p>Dev Test</p>',
      });

      expect(result).toEqual({ messageId: 'simulated-dev-id' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should construct reset link and execute sendMail without throwing', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'reset-resend-id' }),
      });
      global.fetch = mockFetch;

      await expect(
        emailService.sendPasswordResetEmail('student@example.com', 'raw-token-123')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          body: expect.stringContaining('raw-token-123'),
        })
      );
    });
  });

  describe('sendDeadlineReminderEmail', () => {
    it('should send deadline reminder for submission', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'reminder-resend-id' }),
      });
      global.fetch = mockFetch;

      await expect(
        emailService.sendDeadlineReminderEmail('student@example.com', 'Bài tập 1', 24, 'SUBMISSION')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          body: expect.stringContaining('Bài tập 1'),
        })
      );
    });
  });
});
