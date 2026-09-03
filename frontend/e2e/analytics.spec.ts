import { test, expect } from '@playwright/test';

test.describe('Contribution Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock /api/auth/me to always return success to prevent 401 and redirect issues
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

    // Navigate to Analytics Dashboard
    await page.goto('/teacher/analytics');
    await expect(page.getByRole('heading', { name: /Đóng Góp & Giám Sát/i })).toBeVisible();
  });

  test('Should show empty state when no class is selected', async ({ page }) => {
    // Check if the prompt to select a class is visible in the contribution tab
    await expect(page.getByText(/Vui lòng chọn một Lớp học/i)).toBeVisible();

    // Check early warning tab empty state
    await page.getByRole('button', { name: /Cảnh Báo Sớm/i }).click();
    await expect(page.getByText(/Vui lòng chọn một Lớp học/i)).toBeVisible();
  });

  test('Should load analytics overview and group contributions when a class is selected', async ({ page }) => {
    const classSelect = page.locator('select[id="filter-analytics-class"]');
    await expect(classSelect.locator('option').nth(1)).toBeAttached();
    await classSelect.selectOption({ index: 1 });

    // Expect overview metrics to be visible
    await expect(page.getByText('Tỷ lệ nộp bài')).toBeVisible();
    await expect(page.getByText(/83\.33%/)).toBeVisible(); // Mocked submissionRate

    // Expect group cards to be visible
    await expect(page.getByText(/Thuật Toán B-Tree/i)).toBeVisible(); // Mocked group name
    await expect(page.getByText(/Xây Dựng REST API/i)).toBeVisible(); // Mocked group name
  });

  test('Should open group detail modal and show member contributions', async ({ page }) => {
    // Select class first
    const classSelect = page.locator('select[id="filter-analytics-class"]');
    await expect(classSelect.locator('option').nth(1)).toBeAttached();
    
    // Wait for the contributions API to resolve after selecting the class
    const responsePromise = page.waitForResponse(res => res.url().includes('/contributions') && res.status() === 200);
    await classSelect.selectOption({ index: 1 });
    await responsePromise;

    // Find "Xem đóng góp chi tiết" button for a group
    const viewDetailBtn = page.getByRole('button', { name: /Xem đóng góp chi tiết/i }).first();
    await viewDetailBtn.click();

    // Modal should appear
    const modalHeader = page.getByRole('heading', { name: /Chi Tiết Đóng Góp/i });
    await expect(modalHeader).toBeVisible();

    // Expect table headers to be visible
    await expect(page.getByRole('columnheader', { name: /Thành viên/i })).toBeVisible();

    // Expect mocked member to be visible
    await expect(page.getByText('Nguyen Van A (Leader)')).toBeVisible();
    await expect(page.getByText('Le Van C')).toBeVisible();

    // Expect Free-rider risk tag
    await expect(page.getByText(/Free-rider/i).first()).toBeVisible();
    
    // Check if export CSV button exists
    const exportBtn = page.getByRole('button', { name: /Xuất Báo Cáo CSV/i });
    await expect(exportBtn).toBeVisible();
  });

  test('Should download CSV report successfully', async ({ page }) => {
    // Select class first
    const classSelect = page.locator('select[id="filter-analytics-class"]');
    await expect(classSelect.locator('option').nth(1)).toBeAttached();
    
    // Wait for the contributions API to resolve after selecting the class
    const responsePromise = page.waitForResponse(res => res.url().includes('/contributions') && res.status() === 200);
    await classSelect.selectOption({ index: 1 });
    await responsePromise;

    // Open detail modal
    const viewDetailBtn = page.getByRole('button', { name: /Xem đóng góp chi tiết/i }).first();
    await viewDetailBtn.click();

    // Wait for the download event when clicking Export CSV
    const exportBtn = page.getByRole('button', { name: /Xuất Báo Cáo CSV/i });
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toContain('dong_gop_nhom');
  });

  test('Should load early warning panel and filter risks correctly', async ({ page }) => {
    // Select class first
    const classSelect = page.locator('select[id="filter-analytics-class"]');
    await expect(classSelect.locator('option').nth(1)).toBeAttached();
    
    // Select the class
    await classSelect.selectOption({ index: 1 });

    // Go to Early Warning tab
    // Wait for the risks API to resolve after switching to the tab
    const responsePromise = page.waitForResponse(res => res.url().includes('/collaboration-risks') && res.status() === 200);
    await page.getByRole('button', { name: /Cảnh Báo Sớm/i }).click();
    await responsePromise;

    // Expect warnings to be visible (rendered as tags)
    await expect(page.getByText(/LOW_CONTRIBUTION/i)).toBeVisible(); // g-102
    await expect(page.getByText(/UNBALANCED_CONTRIBUTION/i)).toBeVisible(); // g-103

    // Change status filter
    const statusSelect = page.locator('select[id="filter-risk-status"]');
    await statusSelect.selectOption('DISMISSED');

    // Expect empty state text since there are no DISMISSED risks in mock
    await expect(page.getByText(/Tất cả các nhóm đang hoạt động tốt/i)).toBeVisible();
  });
});
