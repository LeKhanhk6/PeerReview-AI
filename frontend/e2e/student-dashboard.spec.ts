import { test, expect } from '@playwright/test';

test.describe('Student Dashboard Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('Should display welcome header and dashboard stats', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Chào mừng trở lại/i })).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByText('Lớp học của tôi', { exact: true })).toBeVisible();
    await expect(page.getByText('Bài tập cần nộp')).toBeVisible();
    await expect(page.getByText('Review cần hoàn thành')).toBeVisible();
  });

  test('Should list active assignments and allow filtering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dự án báo cáo cuối kỳ Phân tích dữ liệu lớn' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thiết kế hệ thống cơ sở dữ liệu phân tán' })).toBeVisible();

    await page.getByRole('button', { name: /Sắp hết hạn/i }).click();
    
    await expect(page.getByRole('heading', { name: 'Thiết kế hệ thống cơ sở dữ liệu phân tán' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dự án báo cáo cuối kỳ Phân tích dữ liệu lớn' })).toBeVisible();

    await page.getByRole('button', { name: /Cần chấm chéo/i }).click();
    
    await expect(page.getByRole('heading', { name: 'Thiết kế hệ thống cơ sở dữ liệu phân tán' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dự án báo cáo cuối kỳ Phân tích dữ liệu lớn' })).toBeVisible();

    await page.getByRole('button', { name: /Tất cả bài tập/i }).click();
    await expect(page.getByRole('heading', { name: 'Thiết kế hệ thống cơ sở dữ liệu phân tán' })).toBeVisible();
  });

  test('Should navigate to workspace when Workspace button is clicked', async ({ page }) => {
    const workspaceLink = page.getByRole('link', { name: /Vào Workspace nhóm/i }).first();
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();

    await expect(page).toHaveURL(/\/student\/groups\/.*\/workspace/);
  });
});
