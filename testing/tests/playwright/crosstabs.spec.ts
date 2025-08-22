import { test, expect, Page, Locator } from '@playwright/test';

// Crosstabs flow modeled after frequencies.spec.ts and explore.spec.ts
// Handles desktop sidebar vs mobile dialog rendering and robust dataset selection.

test('Crosstabs analysis can be opened and run', async ({ page }) => {
  // Navigate to Statify dashboard
  await page.goto('/dashboard/data');

  // Ensure File menu is present
  await expect(page.getByTestId('file-menu-trigger')).toBeVisible();

  // File -> Example Data
  await page.getByTestId('file-menu-trigger').click();
  await expect(page.getByTestId('file-menu-content')).toBeVisible();
  await page.getByTestId('file-menu-example-data').click();

  // Wait for example dataset list to appear
  // Prefer a stable dataset id; fall back to first card
  const preferredDataset = page.getByTestId('example-dataset-demo');
  const fallbackDataset1 = page.getByTestId('example-dataset-customer_dbase');
  const fallbackDataset2 = page.getByTestId('example-dataset-adl');
  const anyDataset = page.locator('[data-testid^="example-dataset-"]').first();
  await Promise.race([
    preferredDataset.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    fallbackDataset1.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    fallbackDataset2.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    anyDataset.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
  ]);

  if (await preferredDataset.isVisible()) {
    await preferredDataset.click();
  } else if (await fallbackDataset1.isVisible()) {
    await fallbackDataset1.click();
  } else if (await fallbackDataset2.isVisible()) {
    await fallbackDataset2.click();
  } else {
    await anyDataset.click();
  }

  // Wait for potential spinner to finish and modal/cards to close/disappear
  const spinner = page.locator('[data-testid="loading-spinner"]');
  // Bound the wait to avoid exceeding overall test timeout
  await Promise.race([
    spinner.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
    page.waitForTimeout(5_000),
  ]);
  // Ensure example dataset modal is closed if present
  const exampleModal = page.getByTestId('example-dataset-modal');
  await exampleModal.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  // Ensure Analyze menu is interactable even if modal remains mounted
  await expect(page.getByTestId('analyze-menu-trigger')).toBeVisible();

  // Analyze -> Descriptive Statistics -> Crosstabs
  await page.getByTestId('analyze-menu-trigger').click();
  await page.getByTestId('descriptive-statistics-trigger').click();
  await page.getByTestId('descriptive-statistics-crosstabs').click();

  // Crosstabs UI: dialog on mobile, sidebar on desktop
  const dialog = page.getByTestId('crosstabs-dialog-container');
  const sidebar = page.getByTestId('crosstabs-sidebar-container');
  const tabs = page.getByTestId('crosstabs-tabs');
  await Promise.race([
    dialog.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    sidebar.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    tabs.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
  ]);

  // Switch to Variables tab if not already active
  try {
    await page.getByRole('tab', { name: /variables/i }).click({ timeout: 5_000 });
  } catch {}

  // Wait for available variables container and at least one item
  const availableContainer = page.getByTestId('available-variables-container');
  if (!(await availableContainer.isVisible().catch(() => false))) {
    // Try clicking the tab trigger by testid
    await page.getByTestId('crosstabs-variables-tab').click({ timeout: 5_000 }).catch(() => {});
  }
  await expect(availableContainer).toBeVisible();
  const availableItems = availableContainer.locator('[data-testid^="variable-item-available-"]');
  await availableItems.first().waitFor({ state: 'visible', timeout: 60_000 });

  // Reset to clean state
  await page.getByTestId('crosstabs-reset-button').click();

  // Helper: click central move (mobile) or arrow move (desktop) button for a target list
  const clickMoveToTarget = async (targetId: 'row' | 'column') => {
    const centralBtn = page.getByTestId(`central-move-button-${targetId}`);
    if (await centralBtn.isVisible().catch(() => false)) {
      await centralBtn.click();
      return;
    }
    const arrowBtn = page.getByTestId(`arrow-move-button-${targetId}`);
    await arrowBtn.click();
  };

  // Helper: move a variable from Available to target via single-click + move button
  const moveAvailableTo = async (targetId: 'row' | 'column', text: RegExp) => {
    const nameLocator = availableContainer.getByText(text).first();
    if (await nameLocator.isVisible().catch(() => false)) {
      await nameLocator.scrollIntoViewIfNeeded().catch(() => {});
      await nameLocator.click();
      await clickMoveToTarget(targetId);
      return true;
    }
    return false;
  };

  // Helper: move the first available variable to target
  const moveFirstAvailableTo = async (targetId: 'row' | 'column') => {
    const firstItem = availableItems.first();
    await firstItem.scrollIntoViewIfNeeded().catch(() => {});
    await firstItem.click();
    await clickMoveToTarget(targetId);
  };

  // Track counts to verify moves
  const rowContainer = page.getByTestId('row-variables-container');
  const colContainer = page.getByTestId('column-variables-container');
  const rowItems = rowContainer.locator('[data-testid^="variable-item-row-"]');
  const colItems = colContainer.locator('[data-testid^="variable-item-column-"]');

  // Move [gender] to Rows (fallback to first available)
  const rowBefore = await rowItems.count();
  const movedGender = await moveAvailableTo('row', /\[gender\]/i);
  if (!movedGender) {
    await moveFirstAvailableTo('row');
  }
  await expect(rowItems).toHaveCount(rowBefore + 1);

  // Move [age] to Columns (fallback to first available)
  const colBefore = await colItems.count();
  const movedAge = await moveAvailableTo('column', /\[age\]/i);
  if (!movedAge) {
    await moveFirstAvailableTo('column');
  }
  await expect(colItems).toHaveCount(colBefore + 1);

  // Switch to Cells tab
  try {
    await page.getByRole('tab', { name: /cells/i }).click({ timeout: 5_000 });
  } catch {}
  // Ensure tab active by clicking testid as fallback
  await page.getByTestId('crosstabs-cells-tab').click({ timeout: 5_000 }).catch(() => {});

  // Ensure relevant options are checked
  const ensureChecked = async (loc: Locator) => {
    await loc.waitFor({ state: 'visible', timeout: 20_000 });
    const state = (await loc.getAttribute('data-state')) ?? '';
    if (state !== 'checked') {
      await loc.click();
    }
  };

  // Counts: Observed (already default true) and Expected
  await ensureChecked(page.getByTestId('crosstabs-observed-checkbox'));
  await ensureChecked(page.getByTestId('crosstabs-expected-checkbox'));

  // Percentages: Row, Column, Total
  await ensureChecked(page.getByTestId('crosstabs-row-percentages-checkbox'));
  await ensureChecked(page.getByTestId('crosstabs-column-percentages-checkbox'));
  await ensureChecked(page.getByTestId('crosstabs-total-percentages-checkbox'));

  // Residuals: Unstandardized, Standardized, Adjusted
  await ensureChecked(page.getByTestId('crosstabs-unstandardized-residuals-checkbox'));
  await ensureChecked(page.getByTestId('crosstabs-standardized-residuals-checkbox'));
  await ensureChecked(page.getByTestId('crosstabs-adjusted-residuals-checkbox'));

  // Run analysis and wait for redirect to result page
  await Promise.all([
    page.waitForURL('**/dashboard/result*', { timeout: 60_000 }),
    page.getByTestId('crosstabs-ok-button').click(),
  ]);

  // Wait for UI to close (dialog or sidebar content)
  await Promise.race([
    dialog.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
    tabs.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
    sidebar.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
  ]);

  // Verify redirected to result page
  await expect(page).toHaveURL(/\/dashboard\/result\b/);
});
