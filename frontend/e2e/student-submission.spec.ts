import { test, expect } from '@playwright/test';

test.describe('Student Submission Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
    
    // Navigate directly to the Submission page for a mock assignment
    await page.goto('/student/assignments/33333333-3333-3333-3333-333333333333/submit');
  });

  test('Should render Submission Page Layout correctly', async ({ page }) => {
    // Check main title
    await expect(page.getByRole('heading', { name: /Nộp Bài Tập Học Phần/i })).toBeVisible();
    
    // Check panels
    await expect(page.getByRole('heading', { name: 'Tải Bài Nộp Mới' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lịch Sử Các Phiên Bản Đã Nộp' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Phản Hồi & Đánh Giá Bài Nộp' })).toBeVisible();
  });

  test('Should display mock submission history and feedback', async ({ page }) => {
    // Check submission history
    await expect(page.getByText('Bao_Cao_Final_Submit.pdf')).toBeVisible();
    await expect(page.getByText('Bao_Cao_Tuan_1_Draft.pdf')).toBeVisible();

    // Check feedback
    await expect(page.getByText('Bài nộp trình bày cấu trúc rất rõ ràng, vẽ sơ đồ CSDL chuẩn hóa 3NF.')).toBeVisible();
    await expect(page.getByText('Phần giải thuật B-Tree nêu chi tiết')).toBeVisible();
  });

  test('Should allow submitting a new file', async ({ page }) => {
    // Upload a dummy file
    await page.setInputFiles('input[type="file"]', {
      name: 'playwright-test-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content')
    });

    // Verify the file is selected (the name should appear in the UI)
    await expect(page.getByText('playwright-test-file.pdf')).toBeVisible();

    // Click submit
    await page.getByRole('button', { name: 'Gửi bài nộp' }).click();

    // Wait for upload simulation (progress bar appears and button changes to Đang nộp...)
    await expect(page.getByRole('button', { name: 'Đang nộp...' })).toBeVisible();

    // Wait for success toast or the new file in history
    await expect(page.getByText('Đã nộp bài tập thành công!')).toBeVisible({ timeout: 5000 });

    // Verify it was added to history
    await expect(page.getByText('playwright-test-file.pdf').first()).toBeVisible();
  });
});
