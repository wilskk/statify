import { test, expect } from '@playwright/test';

/**
 * Descriptive menu tests - minimal but comprehensive
 */

test.describe('Descriptive Menu Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('descriptive menu accessible', async ({ page }) => {
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="descriptive"]').click();
    await expect(page.locator('[data-testid="descriptive-panel"]')).toBeVisible();
  });

  test('descriptive options visible', async ({ page }) => {
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="descriptive"]').click();
    await expect(page.locator('[data-testid="variable-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="options-panel"]')).toBeVisible();
  });

  test('descriptive calculation runs', async ({ page }) => {
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="descriptive"]').click();
    await page.locator('[data-testid="run-analysis"]').click();
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
  });

  test('descriptive results exportable', async ({ page }) => {
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="descriptive"]').click();
    await page.locator('[data-testid="export-results"]').click();
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
  });
});
