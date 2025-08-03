import { test, expect } from '@playwright/test';

/**
 * Data menu tests - minimal but comprehensive
 */

test.describe('Data Menu Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('data menu accessible', async ({ page }) => {
    await page.locator('[data-testid="data-menu"]').click();
    await expect(page.locator('[data-testid="data-dropdown"]')).toBeVisible();
  });

  test('variable management visible', async ({ page }) => {
    await page.locator('[data-testid="data-menu"]').click();
    await page.locator('[data-testid="variables"]').click();
    await expect(page.locator('[data-testid="variable-table"]')).toBeVisible();
  });

  test('data restructuring works', async ({ page }) => {
    await page.locator('[data-testid="data-menu"]').click();
    await page.locator('[data-testid="restructure"]').click();
    await expect(page.locator('[data-testid="restructure-dialog"]')).toBeVisible();
  });

  test('data filtering works', async ({ page }) => {
    await page.locator('[data-testid="data-menu"]').click();
    await page.locator('[data-testid="filter"]').click();
    await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();
  });
});
