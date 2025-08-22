import { test, expect } from '@playwright/test';

// Frequencies flow: uses stable data-testids referenced across k6 tests
// It tolerates desktop sidebar vs mobile dialog rendering.

test('Frequencies analysis can be opened and run', async ({ page }) => {
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

  // Analyze -> Descriptive -> Frequencies
  await page.getByTestId('analyze-menu-trigger').click();
  await page.getByTestId('descriptive-statistics-trigger').click();
  await page.getByTestId('descriptive-statistics-frequencies').click();

  // Frequencies UI: dialog on mobile, sidebar on desktop
  const dialog = page.getByTestId('frequencies-dialog');
  const tabs = page.getByTestId('frequencies-tabs');
  await Promise.race([
    dialog.waitFor({ state: 'visible', timeout: 20_000 }),
    tabs.waitFor({ state: 'visible', timeout: 30_000 }),
  ]);

  // Switch to Variables tab if not already active
  try {
    await page.getByRole('tab', { name: /variables/i }).click({ timeout: 5_000 });
  } catch {}
  // Wait for available variables container and at least one item
  const availableContainer = page.getByTestId('available-variables-container');
  // If not visible yet, try clicking the second tab within the tabs container (Variables is usually 2nd)
  if (!(await availableContainer.isVisible())) {
    const tabList = page.getByTestId('frequencies-tabs').getByRole('tab');
    await tabList.nth(1).click({ timeout: 5_000 }).catch(() => {});
  }
  await expect(availableContainer).toBeVisible();
  const availableItems = availableContainer.locator('[data-testid^="variable-item-available-"]');
  await availableItems.first().waitFor({ state: 'visible', timeout: 60_000 });

  // Reset to clean state
  await page.getByTestId('frequencies-reset-button').click();

  // Helper: move a variable from Available to Selected via single-click + move button
  const moveVariableByText = async (text: RegExp): Promise<boolean> => {
    // Click the variable name within Available list
    const nameLocator = availableContainer.getByText(text).first();
    const count = await nameLocator.count();
    if (count === 0) return false;
    await nameLocator.scrollIntoViewIfNeeded().catch(() => {});
    await nameLocator.click();

    // Click appropriate move button depending on layout (mobile vs desktop)
    const centralBtn = page.getByTestId('central-move-button-selected');
    if (await centralBtn.isVisible().catch(() => false)) {
      await centralBtn.click();
    } else {
      await page.getByTestId('arrow-move-button-selected').click();
    }

    // Verify in Selected list
    const selectedContainer = page.getByTestId('selected-variables-container');
    await expect(selectedContainer.getByText(text)).toBeVisible();
    return true;
  };

  // Fallback: select the first available item by position
  const moveFirstAvailable = async () => {
    const first = availableItems.first();
    await first.scrollIntoViewIfNeeded().catch(() => {});
    await first.click();

    const centralBtn = page.getByTestId('central-move-button-selected');
    if (await centralBtn.isVisible().catch(() => false)) {
      await centralBtn.click();
    } else {
      await page.getByTestId('arrow-move-button-selected').click();
    }
  };

  // Select variables: try [gender], [age]; fallback to first two available
  const movedGender = await moveVariableByText(/\[gender\]/i).catch(() => false);
  if (!movedGender) await moveFirstAvailable();
  const movedAge = await moveVariableByText(/\[age\]/i).catch(() => false);
  if (!movedAge) await moveFirstAvailable();

  // Switch to Statistics tab
  try {
    await page.getByRole('tab', { name: /statistics/i }).click({ timeout: 5_000 });
  } catch {}

  // Ensure all checkboxes in Statistics tab are checked
  const ensureChecked = async (loc: any) => {
    await loc.waitFor({ state: 'visible', timeout: 20_000 });
    const state = (await loc.getAttribute('data-state')) ?? '';
    if (state !== 'checked') {
      await loc.click();
    }
  };

  // Percentile Values section checkboxes (by id)
  await ensureChecked(page.locator('#quartiles'));
  await ensureChecked(page.locator('#cutPoints'));
  await ensureChecked(page.locator('#percentiles'));

  // Statistics checkboxes (by data-testid)
  const statTestIds = [
    'frequencies-mean', 'frequencies-median', 'frequencies-mode', 'frequencies-sum',
    'frequencies-stddev', 'frequencies-variance', 'frequencies-range', 'frequencies-minimum', 'frequencies-maximum', 'frequencies-semean',
    'frequencies-skewness', 'frequencies-kurtosis',
  ];
  for (const tid of statTestIds) {
    await ensureChecked(page.getByTestId(tid));
  }

  // Run analysis and wait for redirect to result page
  await Promise.all([
    page.waitForURL('**/dashboard/result*', { timeout: 60_000 }),
    page.getByTestId('frequencies-ok-button').click(),
  ]);

  // Wait for UI to close (dialog or sidebar content)
  await Promise.race([
    dialog.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
    tabs.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
  ]);

  // Verify redirected to result page
  await expect(page).toHaveURL(/\/dashboard\/result\b/);
});
