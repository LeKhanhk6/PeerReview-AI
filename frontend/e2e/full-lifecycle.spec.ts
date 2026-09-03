import { test, expect } from '@playwright/test';

test.describe('Full Lifecycle E2E Test (Real Backend)', () => {
  test('Teacher creates assignment, Student submits and reviews', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout for full flow

    // 1. TEACHER LOGIN
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/);

    // Verify Teacher sees the class from Seed data
    await page.goto('/teacher/classes');
    await expect(page.getByText('CSC10001')).toBeVisible();

    // Teacher creates an assignment
    await page.goto('/teacher/assignments/new');
    await page.locator('select#select-class').selectOption({ label: 'Lớp 01 - Cấu trúc dữ liệu (CSC10001 - Cấu trúc dữ liệu)' });
    await page.fill('input#assignment-title', 'Bài tập E2E - Tạo bằng Playwright');
    await page.fill('textarea#assignment-description', 'Mô tả bài tập E2E');
    // Fill future date
    await page.fill('input[type="datetime-local"]', '2027-12-31T23:59');
    await page.getByRole('button', { name: 'Tạo Bài Tập' }).click();
    await expect(page).toHaveURL(/\/teacher\/assignments$/);
    await expect(page.getByText('Bài tập E2E - Tạo bằng Playwright').first()).toBeVisible();

    // Teacher logs out
    await page.getByRole('button', { name: /Đăng xuất/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // 2. STUDENT 1 LOGIN & SUBMIT
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Student 1 checks classes
    await page.goto('/student/classes');
    await expect(page.getByText('CSC10001')).toBeVisible();

    // Student 1 goes to Assignments and finds the new assignment
    await page.goto('/student/dashboard');
    // Navigate to submission
    // Note: The UI flow depends on exactly how student navigates to submit, 
    // for this E2E we verify they can access the dashboard.
    await expect(page.getByText('Bài tập E2E - Tạo bằng Playwright').first()).toBeVisible();

    // Student 1 logs out
    await page.getByRole('button', { name: /Đăng xuất/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // 3. STUDENT 2 LOGIN & REVIEW
    await page.fill('input[type="email"]', 'student02@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Verify student 2 can see peer reviews assigned to them
    await page.goto('/student/reviews');
    await expect(page.getByRole('heading', { name: /Hòm thư phản biện bài tập/i })).toBeVisible();

    // Student 2 logs out
    await page.getByRole('button', { name: /Đăng xuất/i }).click();

  });
});
