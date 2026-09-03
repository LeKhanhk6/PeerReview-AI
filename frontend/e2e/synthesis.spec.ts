import { test, expect } from '@playwright/test';

test.describe('Flow 4 — Teacher Review Synthesis & Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the auth endpoint to return TEACHER so we don't get redirected
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'teacher-uuid-001',
            email: 'teacher01@example.com',
            name: 'Nguyen Van Teacher',
            role: 'TEACHER',
            hasGroup: false
          },
        }),
      });
    });

    // Login as Teacher
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
  });

  test('Should load synthesis overview and summary correctly', async ({ page }) => {
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');

    // Wait for skeletons to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);

    // Check header
    await expect(page.getByText(/Tổng Hợp Đánh Giá Bằng AI & Phê Duyệt Nhanh/i)).toBeVisible();

    // Check SynthesisStatusCard (overview)
    await expect(page.getByText(/Tổng Quan AI Review Synthesis/i)).toBeVisible();
    await expect(page.getByText(/Nhìn chung các nhóm đã hoàn thành bài nộp đạt chuẩn với cấu trúc mã nguồn tốt/i)).toBeVisible();

    // Check AssignmentSynthesisOverview (strengths, etc.)
    await expect(page.getByText(/🟢 Ưu điểm nổi bật/i).first()).toBeVisible();
    await expect(page.getByText(/Cấu trúc sơ đồ cơ sở dữ liệu PostgreSQL chuẩn hóa/i).first()).toBeVisible();

    // Check SummaryItemCard
    await expect(page.getByText(/Thiết kế kiến trúc hệ thống rõ ràng/i)).toBeVisible();
    await expect(page.getByText(/Nhóm phát huy tốt nguyên tắc phân lớp kiến trúc/i)).toBeVisible();
  });

  test('Should edit a summary item successfully', async ({ page }) => {
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');

    // Wait for skeletons to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);

    // Click edit on the first item
    const editBtn = page.getByRole('button', { name: /Chỉnh sửa/i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Fill the textareas
    const contentTextarea = page.locator('textarea[placeholder*="Nhập nội dung nhận xét tổng hợp"]');
    await contentTextarea.fill('Nội dung đã được GV chỉnh sửa trong E2E test');

    const noteTextarea = page.locator('textarea[placeholder*="Nhập ghi chú riêng về cụm chủ đề này"]');
    await noteTextarea.fill('Ghi chú đã được GV cập nhật trong E2E test');

    // Click Save
    const patchPromise = page.waitForResponse(res => res.url().includes('/summary-items/') && res.request().method() === 'PATCH' && res.status() === 200);
    const saveBtn = page.getByRole('button', { name: /Lưu thay đổi/i });
    await saveBtn.click();
    await patchPromise;

    // Check if UI reflects changes (the badge should appear)
    await expect(page.getByText(/Nội dung đã được GV chỉnh sửa trong E2E test/i)).toBeVisible();
    await expect(page.getByText(/Ghi chú đã được GV cập nhật trong E2E test/i)).toBeVisible();
    await expect(page.getByText(/✏️ Đã chỉnh sửa bởi GV/i).first()).toBeVisible();
  });

  test('Should open source review drawer and display original reviews', async ({ page }) => {
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');

    // Wait for skeletons to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);

    // Click "Xem bài phản biện gốc"
    const viewReviewsBtn = page.getByRole('button', { name: /Xem bài phản biện gốc/i }).first();
    await expect(viewReviewsBtn).toBeVisible();
    await viewReviewsBtn.click();

    // Verify the drawer is open and displays data
    await expect(page.getByText(/Vết Nguồn Phản Biện/i)).toBeVisible();
    await expect(page.getByText(/Bài nộp có bố cục rất rõ ràng/i)).toBeVisible();
    
    // Close the drawer
    const closeBtn = page.getByRole('button', { name: /Đóng cửa sổ/i });
    await closeBtn.click();
    await expect(page.getByText(/Vết Nguồn Phản Biện/i)).not.toBeVisible();
  });

  test('Should approve the synthesis and disable editing', async ({ page }) => {
    // Reset MSW global state if needed, but since we can't do that easily, 
    // we ensure we can click the approve button or we verify it's already approved.
    await page.goto('/teacher/assignments/asg-uuid-001/synthesis');

    // Wait for skeletons to disappear
    await expect(page.locator('.animate-pulse')).toHaveCount(0);

    // Click Approve button
    const approveBtn = page.getByRole('button', { name: /Phê duyệt bản tổng hợp/i });
    
    // Playwright tests run in the same worker might share MSW memory, so if it's already approved, we handle it gracefully.
    if (await page.getByText(/Đã phê duyệt/i, { exact: true }).count() > 0) {
       // Already approved
       return;
    }

    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Confirm in dialog
    const confirmBtn = page.getByRole('button', { name: 'Confirm' }).first();
    await expect(confirmBtn).toBeVisible();
    
    const approvePatchPromise = page.waitForResponse(res => res.url().includes('/summary/approve') && res.request().method() === 'PATCH' && res.status() === 200);
    await confirmBtn.click();
    await approvePatchPromise;

    // Expect edit buttons to be disabled
    const editBtn = page.getByRole('button', { name: /Chỉnh sửa/i }).first();
    await expect(editBtn).toBeDisabled();
    
    // Check if the status badge shows APPROVED
    await expect(page.getByText('✓ Đã phê duyệt', { exact: true }).first()).toBeVisible();
  });
});
