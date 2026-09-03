import { test, expect } from '@playwright/test';

test.describe('AI Mentor Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Ensure login finishes
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Navigate directly to the Review Writing Screen for ra-101
    await page.goto('/student/reviews/ra-101');
    
    // Expect the Rubric form header to ensure it loaded
    await expect(page.getByText('Phiếu chấm điểm theo Rubric')).toBeVisible();
  });

  test('Should show error when typing too short comment', async ({ page }) => {
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    // Needs to be >= 15 chars to trigger frontend AI call, but < 25 chars or containing "ok" to trigger backend 'Qua loa'
    await overallCommentBox.fill('Bài làm này khá ok nha.');
    
    // AI Mentor has a 1500ms debounce
    await page.waitForTimeout(2500);

    // Expect category 2. Qua loa / Hời hợt
    await expect(page.getByText('Qua loa / Hời hợt')).toBeVisible();
    await expect(page.getByText('Nhận xét còn khá ngắn và hời hợt')).toBeVisible();
  });

  test('Should block/warn when typing toxic comment', async ({ page }) => {
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    await overallCommentBox.fill('Bài làm rất dở và ngu ngốc.');
    
    await page.waitForTimeout(2500);

    // Expect category 1. Tiêu cực / Xúc phạm
    await expect(page.getByText('Tiêu cực / Xúc phạm')).toBeVisible();
    await expect(page.getByText('Lời nhận xét chứa từ ngữ mang tính tiêu cực')).toBeVisible();
  });

  test('Should warn when typing generic positive comment', async ({ page }) => {
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    await overallCommentBox.fill('Bài làm của nhóm rất tốt và đẹp mắt.');
    
    await page.waitForTimeout(2500);

    // Expect category 3. Khen chung chung
    await expect(page.getByText('Khen chung chung')).toBeVisible();
    await expect(page.getByText('Lời khen còn mang tính chung chung')).toBeVisible();
  });

  test('Should apply suggested rewrite from AI Mentor', async ({ page }) => {
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    // We type something generic
    await overallCommentBox.fill('Bài làm của nhóm rất tốt và đẹp mắt.');
    
    await page.waitForTimeout(2500);

    // The suggested rewrite should be visible in a blockquote or similar
    const applyButton = page.getByRole('button', { name: 'Áp dụng câu mẫu' });
    await expect(applyButton).toBeVisible();

    // Click apply
    await applyButton.click();

    // Confirm dialog should appear
    const confirmButton = page.getByRole('button', { name: 'Confirm', exact: true }).or(page.getByRole('button', { name: 'Xác nhận' }));
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    } else {
      await page.getByRole('button', { name: 'Confirm' }).click();
    }

    // Expect the textarea value to be the suggested rewrite
    await expect(overallCommentBox).toHaveValue('Phần trình bày báo cáo rất trực quan và có tính sáng tạo cao. Sơ đồ kiến trúc trình bày chuẩn mực.');
  });

  test('Should show error fallback if AI API fails', async ({ page }) => {
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    await overallCommentBox.fill('trigger_ai_error because we need to test fallback.');
    
    await page.waitForTimeout(2500);

    // Should show error state in AI widget
    await expect(page.getByText('AI Mentor tạm thời không khả dụng')).toBeVisible();
  });
});
