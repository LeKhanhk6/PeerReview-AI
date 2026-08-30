import { test, expect } from '@playwright/test';

test.describe('Flow 3 — Double-Blind Peer Review & AI Mentor Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Student Reviewer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('Reviewer accesses Review Inbox Screen', async ({ page }) => {
    await page.goto('/student/reviews');
    await expect(page.getByText(/Nhiệm vụ Chấm chéo/i)).toBeVisible();
  });

  test('Reviewer opens review assignment and writes rubric feedback', async ({ page }) => {
    await page.goto('/student/reviews/rev-uuid-001');
    
    // Double-blind privacy check: author identity is masked
    await expect(page.getByText(/Tài khoản Chấm chéo Anonymized/i)).toBeVisible();

    // Fill overall comment
    const commentInput = page.getByPlaceholder(/Nhập nhận xét tổng quan/i);
    if (await commentInput.isVisible()) {
      await commentInput.fill('Bài làm thực hiện rất tốt, code sạch sẽ và rõ ràng.');
    }
  });
});
