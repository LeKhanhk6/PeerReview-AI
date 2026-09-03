import { test, expect } from '@playwright/test';

test.describe('Flow 1 — Authentication & Role Redirection Assertions', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/PeerReview-AI/i);
    await expect(page.getByRole('heading', { name: /Đăng nhập/i })).toBeVisible();
  });

  test('Student login redirects to /student/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('Teacher login redirects to /teacher/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/teacher\/dashboard/);
  });

  test('Admin login redirects to /admin/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Security Assertion: Unauthenticated user accessing /admin/dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Security Assertion: Student attempting to access /admin/users is blocked', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student01@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Try navigating to admin route
    await page.goto('/admin/users');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });
});
