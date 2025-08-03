import { test, expect } from '@playwright/test';

/**
 * Example Dataset E2E Tests - Customer Database
 * Tests loading the Customer_db example dataset through File menu
 */

test.describe('Customer Database Example Dataset Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard data page
    await page.goto('/dashboard/data');
    
    // Ensure page is loaded
    await expect(page.locator('[data-testid="main-navbar"]')).toBeVisible();
  });

  test('should load Customer_db dataset from example datasets', async ({ page }) => {
    // Click on File menu
    const fileMenuTrigger = page.locator('[data-testid="file-menu-trigger"]');
    await expect(fileMenuTrigger).toBeVisible();
    await fileMenuTrigger.click();

    // Wait for File menu content to be visible
    const fileMenuContent = page.locator('[data-testid="file-menu-content"]');
    await expect(fileMenuContent).toBeVisible();

    // Click on Example Datasets option
    const exampleDatasetsOption = page.locator('[data-testid="file-menu-example-datasets"]');
    await expect(exampleDatasetsOption).toBeVisible();
    await exampleDatasetsOption.click();

    // Wait for Example Datasets modal to open
    const exampleDatasetsModal = page.locator('[data-testid="example-datasets-modal"]');
    await expect(exampleDatasetsModal).toBeVisible();

    // Find and click on Customer_db dataset
    const customerDbOption = page.locator('text=customer_dbase');
    await expect(customerDbOption).toBeVisible();
    await customerDbOption.click();

    // Verify dataset details are displayed
    const datasetDescription = page.locator('text=Company using data warehouse to make special offers to likely responders.');
    await expect(datasetDescription).toBeVisible();

    // Click Load Dataset button
    const loadButton = page.locator('button:has-text("Load Dataset")');
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // Wait for dataset to load and verify it's displayed in the data table
    await page.waitForTimeout(3000);
    
    // Verify data is loaded by checking for data table presence
    const dataTable = page.locator('[data-testid="data-table"]');
    await expect(dataTable).toBeVisible();
    
    // Verify the dataset name appears in the interface
    await expect(page.locator('text=customer_dbase')).toBeVisible();
  });

  test('should display Customer_db dataset metadata correctly', async ({ page }) => {
    // Open Example Datasets modal
    await page.goto('/dashboard/data');
    await page.locator('[data-testid="file-menu-trigger"]').click();
    await page.locator('[data-testid="file-menu-example-datasets"]').click();

    // Verify Customer_db is in the list
    const customerDbOption = page.locator('text=customer_dbase');
    await expect(customerDbOption).toBeVisible();

    // Click to select Customer_db
    await customerDbOption.click();

    // Verify dataset tags are displayed
    await expect(page.locator('text=marketing')).toBeVisible();
    await expect(page.locator('text=offers')).toBeVisible();

    // Verify dataset description
    const description = page.locator('text=Company using data warehouse to make special offers to likely responders.');
    await expect(description).toBeVisible();
  });

  test('should handle Customer_db dataset loading cancellation', async ({ page }) => {
    // Open Example Datasets modal
    await page.goto('/dashboard/data');
    await page.locator('[data-testid="file-menu-trigger"]').click();
    await page.locator('[data-testid="file-menu-example-datasets"]').click();

    // Select Customer_db dataset
    const customerDbOption = page.locator('text=customer_dbase');
    await customerDbOption.click();

    // Click Cancel button instead of Load
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.locator('[data-testid="example-datasets-modal"]')).not.toBeVisible();
    
    // Verify no data was loaded
    await expect(page.locator('text=customer_dbase')).not.toBeVisible();
  });
});
