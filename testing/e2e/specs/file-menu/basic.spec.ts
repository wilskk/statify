import { test, expect } from '@playwright/test';

/**
 * File menu tests - minimal but comprehensive
 */

test.describe('File Menu Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('file menu accessible', async ({ page }) => {
    await page.locator('[data-testid="file-menu"]').click();
    await expect(page.locator('[data-testid="file-dropdown"]')).toBeVisible();
  });

  test('import csv works', async ({ page }) => {
    await page.locator('[data-testid="file-menu"]').click();
    await page.locator('[data-testid="import-csv"]').click();
    await expect(page.locator('[data-testid="import-dialog"]')).toBeVisible();
  });

  test('export excel works', async ({ page }) => {
    await page.locator('[data-testid="file-menu"]').click();
    await page.locator('[data-testid="export-excel"]').click();
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
  });

  test('recent files list visible', async ({ page }) => {
    await page.locator('[data-testid="file-menu"]').click();
    await expect(page.locator('[data-testid="recent-files"]')).toBeVisible();
  });
});
