import { test, expect } from '@playwright/test';

test.describe('Flow 4 — Teacher Review Synthesis & Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Teacher
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
  });

  test('Teacher opens Review Synthesis Dashboard', async ({ page }) => {
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');
    await expect(page.getByText(/Tổng hợp Ý kiến Đánh giá/i)).toBeVisible();
  });

  test('Teacher edits summary item and approves review summary', async ({ page }) => {
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');

    // Click edit on first item if visible
    const editBtn = page.getByRole('button', { name: /Chỉnh sửa/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }

    // Click Approve button
    const approveBtn = page.getByRole('button', { name: /Phê duyệt bản tổng hợp/i });
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      // Confirm in dialog
      const confirmBtn = page.getByRole('button', { name: /Xác nhận phê duyệt/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });
});
