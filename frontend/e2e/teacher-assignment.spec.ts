import { test, expect } from '@playwright/test';

test.describe('Teacher Assignment Management Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a teacher first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
    
    // Navigate to Assignments
    await page.goto('/teacher/assignments');
  });

  test('Should list mocked assignments correctly', async ({ page }) => {
    // Check if the title is visible
    await expect(page.getByRole('heading', { name: 'Bài tập & Đánh giá' })).toBeVisible();

    // Check if the two mocked assignments are present
    await expect(page.getByRole('heading', { name: 'Bài tập 1 - Triển khai B-Tree' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đồ án 1 - Xây dựng RESTful API' })).toBeVisible();
  });

  test('Should create a new assignment successfully', async ({ page }) => {
    // Click Create button
    await page.getByRole('button', { name: /\+ Tạo Bài Tập Mới/i }).click();
    await expect(page).toHaveURL(/\/teacher\/assignments\/create/);

    // Fill the form
    await page.locator('select#select-class').selectOption({ label: 'Lớp 01 - Cấu trúc dữ liệu (CSC10001 - Cấu trúc dữ liệu và giải thuật)' });
    await page.fill('input#assignment-title', 'Bài tập E2E Test');
    await page.fill('textarea#assignment-description', 'Mô tả bài tập test từ Playwright');
    
    // Set deadline
    await page.fill('input[type="datetime-local"]', '2027-12-31T23:59');

    // Click Submit
    await page.getByRole('button', { name: 'Tạo Bài Tập' }).click();

    // Verify redirect and new assignment is listed
    await expect(page).toHaveURL(/\/teacher\/assignments$/);
    await expect(page.getByRole('heading', { name: 'Bài tập E2E Test' })).toBeVisible();
  });

  test('Should edit an assignment successfully', async ({ page }) => {
    const editButtons = page.getByRole('button', { name: 'Chỉnh sửa' });
    await editButtons.first().click();

    await expect(page).toHaveURL(/\/teacher\/assignments\/.*\/edit/);

    await page.fill('input#assignment-title', 'Bài tập đã sửa từ Playwright');
    
    await page.getByRole('button', { name: 'Lưu Thay Đổi' }).click();

    await expect(page).toHaveURL(/\/teacher\/assignments$/);
    await expect(page.getByRole('heading', { name: 'Bài tập đã sửa từ Playwright' })).toBeVisible();
  });

  test('Should delete an assignment successfully', async ({ page }) => {
    // Target the first assignment
    const deleteButtons = page.getByRole('button', { name: 'Xóa' });
    await deleteButtons.first().click();

    // A confirm dialog should appear
    const dialogTitle = page.getByRole('heading', { name: 'Xóa bài tập' });
    await expect(dialogTitle).toBeVisible();

    // Click Confirm
    await page.getByRole('button', { name: 'Confirm' }).click();

    // The dialog should close and the first assignment should be gone
    // Wait for the success toast or dialog to disappear
    await expect(dialogTitle).not.toBeVisible();
  });
});
