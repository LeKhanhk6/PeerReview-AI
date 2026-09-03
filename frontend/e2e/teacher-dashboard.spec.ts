import { test, expect } from '@playwright/test';

test.describe('Flow 5 — Teacher Dashboard & Early Warnings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock /api/auth/me to always return success for teacher
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '123',
              email: 'teacher01@example.com',
              full_name: 'Mock User',
              role: 'TEACHER',
              capabilities: { audit_enabled: true }
            }
          }
        })
      });
    });

    // Login as a teacher
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Ensure login finishes
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
  });

  test('Should load teacher dashboard overview and metrics', async ({ page }) => {
    // Check if the dashboard title is visible
    await expect(page.getByRole('heading', { name: /Trang tổng quan Giảng viên/i })).toBeVisible();

    // The overview stats should be visible from mockDashboardOverview
    // "Tổng số lớp học"
    await expect(page.getByText('Tổng số lớp học', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true }).first()).toBeVisible();

    // "Tổng số sinh viên"
    await expect(page.getByText('Tổng số sinh viên', { exact: true })).toBeVisible();
    await expect(page.getByText('45', { exact: true }).first()).toBeVisible();

    // "Tỷ lệ nộp bài"
    await expect(page.getByText('Tỷ lệ nộp bài', { exact: true })).toBeVisible();
    await expect(page.getByText(/83\.3%/)).toBeVisible();

    // "Tỷ lệ chấm chéo"
    await expect(page.getByText('Tỷ lệ chấm chéo', { exact: true })).toBeVisible();
    await expect(page.getByText(/84%/)).toBeVisible();
  });

  test('Should list active assignments', async ({ page }) => {
    // Check Assignment list panel
    await expect(page.getByRole('heading', { name: /Bài tập & Đợt đánh giá chéo đang diễn ra/i })).toBeVisible();

    // Check if mock assignment appears (from assignment.handlers.ts)
    // mockAssignments has a title "Bài tập 1 - Triển khai B-Tree"
    await expect(page.getByText('Bài tập 1 - Triển khai B-Tree', { exact: true }).first()).toBeVisible();

    // Buttons
    const trackBtn = page.getByRole('button', { name: /Theo dõi bài nộp/i }).first();
    await expect(trackBtn).toBeVisible();

    const synthBtn = page.getByRole('button', { name: /Xem tổng hợp AI/i }).first();
    await expect(synthBtn).toBeVisible();
  });

  test('Should display early warning risks panel', async ({ page }) => {
    // Check early warning widget title
    await expect(page.getByRole('heading', { name: /Cảnh báo sớm/i })).toBeVisible();
    
    // From analytics.handlers.ts, mockCollaborationRisks:
    // "Thành viên Le Van C có đóng góp cực kỳ thấp..."
    await expect(page.getByText(/Le Van C có đóng góp cực kỳ thấp/i)).toBeVisible();

    // Check risk tags (Nghiêm trọng / Cần lưu ý)
    await expect(page.getByText('Nghiêm trọng', { exact: true }).first()).toBeVisible();
    
    // "Nhóm 03 chưa phát sinh bất kỳ tương tác..."
    await expect(page.getByText(/Nhóm 03 chưa phát sinh bất kỳ tương tác/i)).toBeVisible();

    // Navigation button to analytics
    const viewAllBtn = page.getByText(/Xem tất cả cảnh báo/i);
    await expect(viewAllBtn).toBeVisible();
  });

  test('Should filter metrics and risks by class', async ({ page }) => {
    // Select class from dropdown
    const classSelect = page.locator('select[id="class-select"]');
    await expect(classSelect.locator('option').nth(1)).toBeAttached();
    
    // Change option
    await classSelect.selectOption({ index: 1 });

    // Ensure it still displays metrics (the mock API returns the same metrics for any classId)
    await expect(page.getByText('Tổng số sinh viên', { exact: true })).toBeVisible();
  });
});
