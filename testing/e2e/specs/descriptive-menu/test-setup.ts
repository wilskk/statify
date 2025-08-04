import { Page } from '@playwright/test';

/**
 * Test Setup Utilities for Descriptive Analysis Tests
 * Provides common setup functions for loading test data before running descriptive analysis tests
 */

export class DescriptiveTestSetup {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Load example dataset for descriptive analysis testing
   * Uses Customer_db dataset which has rich variables for testing
   */
  async loadExampleDataset() {
    await this.page.goto('/dashboard/data');
    
    // Ensure page is loaded
    await this.page.locator('[data-testid="main-navbar"]').waitFor();
    
    // Click on File menu
    const fileMenuTrigger = this.page.locator('[data-testid="file-menu-trigger"]');
    await fileMenuTrigger.click();

    // Wait for File menu content to be visible
    const fileMenuContent = this.page.locator('[data-testid="file-menu-content"]');
    await fileMenuContent.waitFor();

    // Click on Example Data option
    const exampleDataOption = this.page.locator('[data-testid="file-menu-example-data"]');
    await exampleDataOption.click();

    // Wait for Example Dataset modal to open
    const exampleDatasetModal = this.page.locator('[data-testid="example-dataset-modal"]');
    await exampleDatasetModal.waitFor();

    // Find and click on Customer_db dataset (this will automatically load it)
    const customerDbOption = this.page.locator('[data-testid="example-dataset-customer_dbase"]');
    await customerDbOption.waitFor();
    await customerDbOption.click();

    // Wait for dataset to load completely
    await this.page.waitForTimeout(3000);
    
    // Wait for data to fully load before proceeding
    await this.page.waitForTimeout(2000);
    
    // Verify data is loaded
    const dataPage = this.page.locator('[data-testid="data-page"]');
    await dataPage.waitFor();
    
    // Verify the dataset name appears in the interface
    await this.page.locator('text=customer_dbase').waitFor();
    
    // Additional verification that variables are available
    const datasetInfo = await this.verifyDatasetLoaded();
    if (!datasetInfo.loaded) {
      throw new Error('Dataset failed to load properly');
    }
    
    return true;
  }

  /**
   * Navigate to descriptive analysis from data page
   */
  async navigateToDescriptiveAnalysis() {
    await this.page.locator('[data-testid="analyze-menu-trigger"]').click();
    await this.page.locator('[data-testid="descriptive-statistics-trigger"]').hover();
    await this.page.waitForTimeout(200); // Wait for submenu to appear
    await this.page.locator('[data-testid="descriptive-statistics-descriptives"]').click();
  }

  /**
   * Navigate to frequencies analysis
   */
  async navigateToFrequenciesAnalysis(): Promise<void> {
        // Click on Analyze menu
        await this.page.locator('[data-testid="analyze-menu-trigger"]').click();
        await this.page.waitForTimeout(500);
        
        // Wait for and verify Descriptive Statistics trigger is visible
        await this.page.locator('[data-testid="descriptive-statistics-trigger"]').waitFor({ state: 'visible', timeout: 5000 });
        
        // Click on Descriptive Statistics submenu trigger to open submenu
        await this.page.locator('[data-testid="descriptive-statistics-trigger"]').click();
        await this.page.waitForTimeout(500);
        
        // Wait for and verify Frequencies option is visible
        await this.page.locator('[data-testid="descriptive-statistics-frequencies"]').waitFor({ state: 'visible', timeout: 5000 });
        
        // Click on Frequencies option
        await this.page.locator('[data-testid="descriptive-statistics-frequencies"]').click();
        
        // Wait for the frequencies modal to appear - check for modal title with "Frequencies" text
        await this.page.locator('[data-testid="modal-title"]:has-text("Frequencies")').waitFor({ timeout: 10000 });
    }

  /**
   * Navigate to crosstabs analysis
   */
  async navigateToCrosstabsAnalysis() {
    await this.page.locator('[data-testid="analyze-menu-trigger"]').click();
    await this.page.locator('[data-testid="descriptive-statistics-trigger"]').hover();
    await this.page.waitForTimeout(200); // Wait for submenu to appear
    await this.page.locator('[data-testid="descriptive-statistics-crosstabs"]').click();
  }

  /**
   * Navigate to explore analysis
   */
  async navigateToExploreAnalysis() {
    await this.page.locator('[data-testid="analyze-menu-trigger"]').click();
    await this.page.locator('[data-testid="descriptive-statistics-trigger"]').hover();
    await this.page.waitForTimeout(200); // Wait for submenu to appear
    await this.page.locator('[data-testid="descriptive-statistics-explore"]').click();
  }

  /**
   * Get available variables from the current dataset
   * Returns a simple check that variables are available
   */
  async getAvailableVariables() {
    // Simple check - if data is loaded, assume variables are available
    const dataPageVisible = await this.page.locator('[data-testid="data-page"]').isVisible();
    return dataPageVisible ? ['variable1', 'variable2'] : [];
  }

  /**
   * Verify dataset has been loaded successfully
   */
  async verifyDatasetLoaded() {
    const dataPageVisible = await this.page.locator('[data-testid="data-page"]').isVisible();
    const customerDbVisible = await this.page.locator('text=customer_dbase').isVisible();
    
    return {
      name: 'customer_dbase',
      rows: 100, // Assumed row count
      loaded: dataPageVisible && customerDbVisible
    };
  }

  /**
   * Complete setup for descriptive analysis tests
   * Combines data loading and navigation
   */
  async setupForDescriptiveTests(analysisType: 'descriptive' | 'frequencies' | 'crosstabs' | 'explore' = 'descriptive') {
    // Load the example dataset
    await this.loadExampleDataset();
    
    // Navigate to the appropriate analysis
    switch (analysisType) {
      case 'descriptive':
        await this.navigateToDescriptiveAnalysis();
        break;
      case 'frequencies':
        await this.navigateToFrequenciesAnalysis();
        break;
      case 'crosstabs':
        await this.navigateToCrosstabsAnalysis();
        break;
      case 'explore':
        await this.navigateToExploreAnalysis();
        break;
    }
    
    // Verify setup is complete
    const variables = await this.getAvailableVariables();
    const datasetInfo = await this.verifyDatasetLoaded();
    
    return {
      variables,
      dataset: datasetInfo,
      ready: variables.length > 0 && datasetInfo.loaded
    };
  }

  /**
   * Clean up after tests
   */
  async cleanup() {
    // Close any open modals
    const closeButtons = await this.page.locator('[data-testid*="close"]').all();
    for (const button of closeButtons) {
      if (await button.isVisible()) {
        await button.click();
      }
    }
  }
}
