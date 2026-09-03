import { test, expect } from '@playwright/test';

test.describe('Student Group Workspace Assertions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);
    
    // Navigate directly to Group Workspace mock URL
    await page.goto('/student/groups/g-101/workspace');
  });

  test('Should render Workspace Layout correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Không Gian Làm Việc Nhóm/i })).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('button', { name: '📋 Bảng Công Việc' })).toBeVisible();
    await expect(page.getByRole('button', { name: '💬 Thảo Luận Nhóm' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📜 Nhật Ký Hoạt Động' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📁 Tài Liệu Nhóm' })).toBeVisible();
  });

  test('Should list and create tasks in Kanban tab', async ({ page }) => {
    // Check mock tasks are visible
    await expect(page.getByText('Thiết kế sơ đồ CSDL PostgreSQL')).toBeVisible();
    await expect(page.getByText('Viết API Endpoints cho Auth & Class')).toBeVisible();
    await expect(page.getByText('Triển khai giao diện Bảng Kanban & Tab Thảo luận')).toBeVisible();

    // Click Add Task
    await page.getByRole('button', { name: '+ Thêm công việc' }).click();
    
    // Dialog appears
    await expect(page.getByRole('heading', { name: 'Tạo Công Việc Mới' })).toBeVisible();

    // Fill task title
    await page.fill('input[placeholder="Nhập tên hoặc mô tả ngắn gọn công việc..."]', 'Task E2E Test');
    
    // Submit task
    await page.getByRole('button', { name: 'Tạo task' }).click();

    // Wait for the new task to appear
    await expect(page.getByText('Task E2E Test')).toBeVisible();
  });

  test('Should list and send messages in Discussions tab', async ({ page }) => {
    await page.getByRole('button', { name: '💬 Thảo Luận Nhóm' }).click();

    // Check mock discussion messages
    await expect(page.getByText('Chào cả nhóm, chúng ta cần hoàn thiện phần API trước deadline Thứ 6 nhé!')).toBeVisible();
    await expect(page.getByText('Mình đang xử lý endpoint Workspace rồi nhé A.')).toBeVisible();

    // Send a new message
    await page.fill('input[placeholder="Nhập tin nhắn thảo luận nhóm..."]', 'Tin nhắn test từ Playwright');
    await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();

    // Wait for the new message to appear
    await expect(page.getByText('Tin nhắn test từ Playwright')).toBeVisible();
  });

  test('Should list activities in Timeline tab', async ({ page }) => {
    await page.getByRole('button', { name: '📜 Nhật Ký Hoạt Động' }).click();

    // Check mock activities
    await expect(page.getByText('Đã tạo công việc: "Thiết kế sơ đồ CSDL PostgreSQL"')).toBeVisible();
    await expect(page.getByText('Đã chuyển trạng thái task "Viết API Endpoints" sang IN_PROGRESS')).toBeVisible();
  });

  test('Should list files in Files tab', async ({ page }) => {
    await page.getByRole('button', { name: '📁 Tài Liệu Nhóm' }).click();

    // Check mock files
    await expect(page.getByText('So_Do_CSDL_DBDiagram.pdf')).toBeVisible();
  });
});
