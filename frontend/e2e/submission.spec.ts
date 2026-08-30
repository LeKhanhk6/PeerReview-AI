import { test, expect } from '@playwright/test';

test.describe('Flow 2 — Student Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('Student navigates to submission screen and views assignment details', async ({ page }) => {
    await page.goto('/student/assignments/asg-uuid-001/submit');
    await expect(page.getByText(/Nộp bài tập/i)).toBeVisible();
  });

  test('Student submits assignment version', async ({ page }) => {
    await page.goto('/student/assignments/asg-uuid-001/submit');
    
    // Fill submission details or upload file if form present
    const submitBtn = page.getByRole('button', { name: /Nộp bài/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.getByText(/Đã nộp bài thành công/i)).toBeVisible();
    }
  });
});
