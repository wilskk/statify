import { test, expect } from '@playwright/test';

/**
 * Dashboard menu tests - minimal but comprehensive
 */

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('dashboard loads successfully', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
  });

  test('navigation menu items visible', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-file"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analysis"]')).toBeVisible();
  });

  test('dashboard widgets functional', async ({ page }) => {
    await expect(page.locator('[data-testid="data-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });
});
