import { test, expect } from '@playwright/test';

// Explore flow: mirrors Frequencies/Descriptives test structure using stable data-testids
// Handles desktop sidebar vs mobile dialog rendering.

test('Explore analysis can be opened and run', async ({ page }) => {
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

  // Ensure Analyze/Descriptive menu is interactable even if modal remains mounted
  // Try Analyze -> Descriptive -> Explore first; fall back to Descriptive menu direct.
  const openExploreModal = async () => {
    const analyzeTrigger = page.getByTestId('analyze-menu-trigger');
    if (await analyzeTrigger.isVisible().catch(() => false)) {
      await analyzeTrigger.click();
      const descriptiveStatsTrigger = page.getByTestId('descriptive-statistics-trigger');
      if (await descriptiveStatsTrigger.isVisible().catch(() => false)) {
        await descriptiveStatsTrigger.click();
        const exploreViaStats = page.getByTestId('descriptive-statistics-explore');
        if (await exploreViaStats.isVisible().catch(() => false)) {
          await exploreViaStats.click();
          return;
        }
      }
    }
    // Fallback to Descriptive menu directly
    const descriptiveTrigger = page.getByTestId('descriptive-menu-trigger');
    await descriptiveTrigger.click();
    await page.getByTestId('descriptive-menu-content').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByTestId('descriptive-menu-explore').click();
  };

  await openExploreModal();

  // Explore UI: dialog on mobile, tabs on desktop
  const dialog = page.getByTestId('explore-dialog');
  const tabs = page.getByTestId('explore-tabs');
  await Promise.race([
    dialog.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
    tabs.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
  ]);

  // Switch/ensure Variables tab active
  const variablesTabTrigger = page.getByTestId('explore-variables-tab');
  try {
    await variablesTabTrigger.click({ timeout: 5_000 });
  } catch {}

  // Wait for available variables container and at least one item
  const availableContainer = page.getByTestId('available-variables-container');
  await expect(availableContainer).toBeVisible();
  const availableItems = availableContainer.locator('[data-testid^="variable-item-available-"]');
  await availableItems.first().waitFor({ state: 'visible', timeout: 60_000 });

  // Reset to clean state
  await page.getByTestId('explore-reset-button').click();

  // Helper: move currently selected available variable to a target list via single-click + move button
  const moveFirstAvailableTo = async (target: 'dependent' | 'factor') => {
    const item = availableItems.first();
    await item.scrollIntoViewIfNeeded().catch(() => {});
    await item.click();

    // Click appropriate move button depending on layout (mobile vs desktop)
    const centralBtn = page.getByTestId(`central-move-button-${target}`);
    if (await centralBtn.isVisible().catch(() => false)) {
      await centralBtn.click();
    } else {
      await page.getByTestId(`arrow-move-button-${target}`).click();
    }
  };

  // Helper: move variable by text into target list; returns boolean success
  const moveAvailableTo = async (target: 'dependent' | 'factor', text: RegExp): Promise<boolean> => {
    const nameLocator = availableContainer.getByText(text).first();
    const count = await nameLocator.count();
    if (count === 0) return false;
    await nameLocator.scrollIntoViewIfNeeded().catch(() => {});
    await nameLocator.click();

    const centralBtn = page.getByTestId(`central-move-button-${target}`);
    if (await centralBtn.isVisible().catch(() => false)) {
      await centralBtn.click();
    } else {
      await page.getByTestId(`arrow-move-button-${target}`).click();
    }
    return true;
  };

  // Verify target containers start empty
  const dependentContainer = page.getByTestId('dependent-variables-container');
  const factorContainer = page.getByTestId('factor-variables-container');
  await expect(dependentContainer.locator('[data-testid^="variable-item-dependent-"]')).toHaveCount(0);
  await expect(factorContainer.locator('[data-testid^="variable-item-factor-"]')).toHaveCount(0);

  // Move [age] to Dependent; fallback to first available
  const depItems = dependentContainer.locator('[data-testid^="variable-item-dependent-"]');
  const depBefore = await depItems.count();
  const movedAge = await moveAvailableTo('dependent', /\[age\]/i).catch(() => false);
  if (!movedAge) {
    await moveFirstAvailableTo('dependent');
  }
  await expect(depItems).toHaveCount(depBefore + 1);

  // Move [gender] to Factor; fallback to first available
  const factorItems = factorContainer.locator('[data-testid^="variable-item-factor-"]');
  const factorBefore = await factorItems.count();
  const movedGender = await moveAvailableTo('factor', /\[gender\]/i).catch(() => false);
  if (!movedGender) {
    await moveFirstAvailableTo('factor');
  }
  await expect(factorItems).toHaveCount(factorBefore + 1);

  // Switch to Statistics tab
  const statisticsTabTrigger = page.getByTestId('explore-statistics-tab');
  try {
    await statisticsTabTrigger.click({ timeout: 5_000 });
  } catch {}

  // Ensure key checkboxes in Statistics tab are checked
  const ensureChecked = async (loc: any) => {
    await loc.waitFor({ state: 'visible', timeout: 20_000 });
    const state = (await loc.getAttribute('data-state')) ?? '';
    if (state !== 'checked') {
      await loc.click();
    }
  };

  await ensureChecked(page.getByTestId('explore-descriptives-checkbox'));
  await ensureChecked(page.locator('#mEstimators'));
  await ensureChecked(page.getByTestId('explore-outliers-checkbox'));
  await ensureChecked(page.locator('#percentiles'));

  // Optionally set CI if empty
  const ciInput = page.getByTestId('explore-confidence-interval-input');
  await ciInput.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  try {
    const val = await ciInput.inputValue();
    if (!val) {
      await ciInput.fill('95');
    }
  } catch {}

  // Run analysis and wait for redirect to result page
  await Promise.all([
    page.waitForURL('**/dashboard/result*', { timeout: 60_000 }),
    page.getByTestId('explore-ok-button').click(),
  ]);

  // Wait for UI to close (dialog or tabs)
  await Promise.race([
    dialog.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
    tabs.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {}),
  ]);

  // Verify redirected to result page
  await expect(page).toHaveURL(/\/dashboard\/result\b/);
});
