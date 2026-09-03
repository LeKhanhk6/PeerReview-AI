import { test, expect } from '@playwright/test';

test.describe('Peer Review Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
    
    // Navigate directly to the Peer Review Inbox for a mock assignment
    await page.goto('/student/assignments/33333333-3333-3333-3333-333333333333/reviews');
  });

  test('Should render Review Inbox Layout and list assignments', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Hòm thư phản biện bài tập/i })).toBeVisible();

    // Check if the mock review assignments are listed
    await expect(page.getByText('Anonymous Submission A7F2BC')).toBeVisible();
    await expect(page.getByText('Anonymous Submission B9D4E1')).toBeVisible();
    await expect(page.getByText('Anonymous Submission C3F8A2')).toBeVisible();

    // Check status filters
    await page.getByRole('button', { name: 'Chưa chấm' }).click();
    await expect(page.getByText('Anonymous Submission A7F2BC')).toBeVisible();
    await expect(page.getByText('Anonymous Submission B9D4E1')).toBeHidden();
  });

  test('Should allow writing and submitting a review', async ({ page }) => {
    // Navigate directly to a specific pending review assignment
    await page.goto('/student/assignments/33333333-3333-3333-3333-333333333333/reviews/ra-101');

    // Wait for the layout to render
    await expect(page.getByRole('heading', { name: /Đánh giá chéo bài làm/i })).toBeVisible();

    // Check if AI Mentor widget is available (by checking overall comment field label)
    await expect(page.getByText('Nhận xét tổng quan chung cho bài làm')).toBeVisible();

    // Fill the score for the first criterion (weight 40)
    await page.locator('input[id="score-d4e5f6a1-b2c3-4d5e-8f9a-0b1c2d3e4f5a"]').fill('35');
    // Fill the comment for the first criterion
    await page.locator('input[id="comment-d4e5f6a1-b2c3-4d5e-8f9a-0b1c2d3e4f5a"]').fill('Kiến trúc khá tốt, chi tiết');

    // Fill the score for the second criterion (weight 30)
    await page.locator('input[id="score-a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d"]').fill('25');

    // Fill the score for the third criterion (weight 30)
    await page.locator('input[id="score-f1e2d3c4-b5a6-4f7e-9d8c-7b6a5f4e3d2c"]').fill('20');

    // Fill the overall comment with something negative to trigger AI Mentor toxic warning
    const overallCommentBox = page.locator('textarea[id="overall-comment"]');
    await overallCommentBox.fill('Bài làm rất dở và ngu ngốc.');

    // AI Mentor is auto-triggered after debounce, or we might need to wait for its feedback
    // The debounce in useAIMentor is usually 500-1000ms. Wait for AI Mentor response badge.
    await expect(page.getByText('Tiêu cực / Xúc phạm')).toBeVisible({ timeout: 5000 });

    // Fill with a better constructive comment
    await overallCommentBox.fill('Bài làm thiết kế kiến trúc rõ ràng, nhưng cần tối ưu thêm thuật toán.');
    await expect(page.getByText('Góp ý chi tiết bám sát Rubric')).toBeVisible({ timeout: 5000 });

    // Submit the review
    await page.getByRole('button', { name: 'Nộp bài phản biện' }).click();

    // Check for validation error messages (e.g., those containing "⚠️")
    const errorMessages = page.locator('p[role="alert"]:has-text("⚠️")');
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        console.log(`Validation error ${i}:`, await errorMessages.nth(i).textContent());
      }
    }

    await page.waitForTimeout(1000); // Wait a bit for dialog to appear
    console.log("PAGE TEXT:", await page.locator('body').textContent());

    // Confirm submission dialog
    const confirmBtn = page.getByRole('button', { name: 'Confirm', exact: true });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    } else {
      // Fallback
      await page.getByRole('button', { name: 'Confirm' }).click();
    }

    // Wait for success toast
    await expect(page.getByText('Đã nộp bài phản biện thành công!')).toBeVisible({ timeout: 5000 });

    // It should redirect to inbox
    await expect(page).toHaveURL(/\/student\/assignments\/33333333-3333-3333-3333-333333333333\/reviews/);
  });
});
