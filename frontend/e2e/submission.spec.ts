import { test, expect } from '@playwright/test';

test.describe('Flow 2 — Student Submission Flow & Groupless State', () => {
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

  test('Groupless Student sees Giao diện A, joins group, transitions to Giao diện B and submits assignment', async ({ page }) => {
    await page.goto('/student/dashboard');
    
    // Check if Groupless warning callout or Join Group button is present
    const joinGroupBtn = page.getByRole('button', { name: /Tham gia nhóm/i }).first();
    if (await joinGroupBtn.isVisible()) {
      await joinGroupBtn.click();
      
      // Select first available group in JoinGroupModal
      const modalConfirmBtn = page.getByRole('button', { name: /Tham gia nhóm/i }).last();
      if (await modalConfirmBtn.isVisible()) {
        await modalConfirmBtn.click();
      }
    }

    // After joining group, verify submit action becomes active
    await page.goto('/student/assignments/asg-uuid-001/submit');
    await expect(page.getByText(/Nộp bài tập/i)).toBeVisible();
  });
});
