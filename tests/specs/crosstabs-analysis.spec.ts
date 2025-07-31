import { test, expect } from '@playwright/test';

/**
 * Interface untuk metrik performa testing
 * Digunakan untuk memantau kinerja komponen Crosstabs
 */
interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  errorRate: number;
  networkRequests: number;
  networkLatency: number;
  domNodes: number;
  jsHeapSize: number;
  loadTime: number;
  interactionTime: number;
  browserInfo: {
    name: string;
    version: string;
    platform: string;
  };
}

/**
 * Kelas untuk memantau dan menganalisis metrik performa
 * Menyediakan fungsi untuk tracking dan validasi threshold performa
 */
class ResourceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private thresholds = {
    renderTime: 3000,
    updateTime: 1000,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    errorRate: 0,
    networkLatency: 2000,
    domNodes: 5000,
    jsHeapSize: 50 * 1024 * 1024, // 50MB
    loadTime: 5000,
    interactionTime: 500
  };

  /**
   * Memulai monitoring performa
   */
  startMonitoring(): void {
    this.startTime = Date.now();
  }

  /**
   * Mengumpulkan metrik performa dari browser
   */
  async collectMetrics(page: any): Promise<PerformanceMetrics> {
    const endTime = Date.now();
    const renderTime = endTime - this.startTime;

    // Mengumpulkan metrik dari browser
    const metrics = await page.evaluate(() => {
      const performance = window.performance;
      const memory = (performance as any).memory;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        memoryUsage: memory ? memory.usedJSHeapSize : 0,
        jsHeapSize: memory ? memory.totalJSHeapSize : 0,
        domNodes: document.querySelectorAll('*').length,
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        networkRequests: performance.getEntriesByType('resource').length,
        networkLatency: navigation ? navigation.responseEnd - navigation.requestStart : 0
      };
    });

    const browserInfo = await page.evaluate(() => {
      const ua = navigator.userAgent;
      let name = 'Unknown';
      let version = 'Unknown';
      
      if (ua.includes('Chrome')) {
        name = 'Chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (ua.includes('Firefox')) {
        name = 'Firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      } else if (ua.includes('Safari')) {
        name = 'Safari';
        const match = ua.match(/Version\/(\d+)/);
        version = match ? match[1] : 'Unknown';
      }
      
      return {
        name,
        version,
        platform: navigator.platform
      };
    });

    const metric: PerformanceMetrics = {
      renderTime,
      updateTime: 0,
      memoryUsage: metrics.memoryUsage,
      errorRate: 0,
      networkRequests: metrics.networkRequests,
      networkLatency: metrics.networkLatency,
      domNodes: metrics.domNodes,
      jsHeapSize: metrics.jsHeapSize,
      loadTime: metrics.loadTime,
      interactionTime: 0,
      browserInfo
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Memvalidasi apakah metrik memenuhi threshold yang ditetapkan
   */
  validateThresholds(metric: PerformanceMetrics): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (metric.renderTime > this.thresholds.renderTime) {
      violations.push(`Render time exceeded: ${metric.renderTime}ms > ${this.thresholds.renderTime}ms`);
    }
    if (metric.memoryUsage > this.thresholds.memoryUsage) {
      violations.push(`Memory usage exceeded: ${metric.memoryUsage} > ${this.thresholds.memoryUsage}`);
    }
    if (metric.networkLatency > this.thresholds.networkLatency) {
      violations.push(`Network latency exceeded: ${metric.networkLatency}ms > ${this.thresholds.networkLatency}ms`);
    }
    if (metric.domNodes > this.thresholds.domNodes) {
      violations.push(`DOM nodes exceeded: ${metric.domNodes} > ${this.thresholds.domNodes}`);
    }
    if (metric.jsHeapSize > this.thresholds.jsHeapSize) {
      violations.push(`JS heap size exceeded: ${metric.jsHeapSize} > ${this.thresholds.jsHeapSize}`);
    }
    if (metric.loadTime > this.thresholds.loadTime) {
      violations.push(`Load time exceeded: ${metric.loadTime}ms > ${this.thresholds.loadTime}ms`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Mendapatkan ringkasan statistik dari semua metrik yang dikumpulkan
   */
  getStatistics() {
    if (this.metrics.length === 0) return null;

    const stats = {
      count: this.metrics.length,
      averageRenderTime: this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
      averageMemoryUsage: this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length,
      averageNetworkLatency: this.metrics.reduce((sum, m) => sum + m.networkLatency, 0) / this.metrics.length,
      maxRenderTime: Math.max(...this.metrics.map(m => m.renderTime)),
      maxMemoryUsage: Math.max(...this.metrics.map(m => m.memoryUsage)),
      totalNetworkRequests: this.metrics.reduce((sum, m) => sum + m.networkRequests, 0)
    };

    return stats;
  }

  /**
   * Mereset semua metrik yang dikumpulkan
   */
  reset(): void {
    this.metrics = [];
    this.startTime = 0;
  }
}

test.describe('Crosstabs Analysis Workflow', () => {
  let resourceMonitor: ResourceMonitor;
  let jsErrors: Error[] = [];
  let networkErrors: any[] = [];

  test.beforeEach(async ({ page }) => {
    resourceMonitor = new ResourceMonitor();
    jsErrors = [];
    networkErrors = [];

    // Monitor JavaScript errors
    page.on('pageerror', (error) => {
      jsErrors.push(error);
      console.error('JavaScript error:', error.message);
    });

    // Monitor network errors
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText
      });
      console.error('Network error:', request.url(), request.failure()?.errorText);
    });

    // Navigate to application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Collect final metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    const validation = resourceMonitor.validateThresholds(finalMetrics);
    
    if (!validation.passed) {
      console.warn('Performance threshold violations:', validation.violations);
    }

    // Log statistics
    const stats = resourceMonitor.getStatistics();
    if (stats) {
      console.log('Performance Statistics:', {
        averageRenderTime: `${stats.averageRenderTime.toFixed(2)}ms`,
        averageMemoryUsage: `${(stats.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
        averageNetworkLatency: `${stats.averageNetworkLatency.toFixed(2)}ms`,
        maxRenderTime: `${stats.maxRenderTime}ms`,
        totalNetworkRequests: stats.totalNetworkRequests
      });
    }

    resourceMonitor.reset();
  });

  test('should complete basic crosstabs workflow with accidents dataset', async ({ page }) => {
    resourceMonitor.startMonitoring();
    
    // Load accidents dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Verify dataset is loaded
    await expect(page.locator('text=accidents.sav')).toBeVisible();
    
    // Navigate to Crosstabs
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Crosstabs...');
    await page.waitForTimeout(2000);
    
    // Verify Crosstabs dialog opens
    await expect(page.locator('text=Crosstabs')).toBeVisible();
    
    // Verify required variables are available
    const variablesList = page.locator('[data-testid="available-variables-list"]');
    await expect(variablesList).toBeVisible();
    
    // Select row variable (first available variable)
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="row-variables-list"]'));
    await page.waitForTimeout(1000);
    
    // Select column variable (second available variable)
    const secondVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await secondVariable.dragTo(page.locator('[data-testid="column-variables-list"]'));
    await page.waitForTimeout(1000);
    
    // Verify variables are selected
    await expect(page.locator('[data-testid="row-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="column-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
    
    // Execute analysis
    await page.click('button:has-text("OK")');
    await page.waitForTimeout(8000); // Allow time for analysis
    
    // Verify results are displayed
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    
    // Verify specific result components are present
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    
    // Check for crosstabs specific output
    const resultTables = page.locator('[data-testid^="result-table-"]');
    await expect(resultTables.first()).toBeVisible({ timeout: 10000 });
    
    // Collect performance metrics
    const metrics = await resourceMonitor.collectMetrics(page);
    console.log('Basic workflow metrics:', {
      renderTime: `${metrics.renderTime}ms`,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      domNodes: metrics.domNodes,
      browserInfo: metrics.browserInfo
    });
    
    // Verify no errors occurred
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle comprehensive crosstabs options', async ({ page }) => {
    resourceMonitor.startMonitoring();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Navigate to Crosstabs
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Crosstabs...');
    await page.waitForTimeout(2000);
    
    // Configure variables
    const availableVariables = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]');
    const variableCount = await availableVariables.count();
    
    // Add multiple row variables
    for (let i = 0; i < Math.min(2, variableCount); i++) {
      await availableVariables.nth(i).dragTo(page.locator('[data-testid="row-variables-list"]'));
      await page.waitForTimeout(500);
    }
    
    // Add multiple column variables
    for (let i = 0; i < Math.min(2, Math.max(0, variableCount - 2)); i++) {
      await availableVariables.nth(i).dragTo(page.locator('[data-testid="column-variables-list"]'));
      await page.waitForTimeout(500);
    }
    
    // Navigate to Cells tab
    await page.click('[data-testid="crosstabs-cells-tab"]');
    await page.waitForTimeout(1000);
    
    // Configure cell options
    await page.check('[data-testid="observed-counts-checkbox"]');
    await page.check('[data-testid="expected-counts-checkbox"]');
    await page.check('[data-testid="row-percentages-checkbox"]');
    await page.check('[data-testid="column-percentages-checkbox"]');
    await page.check('[data-testid="total-percentages-checkbox"]');
    await page.check('[data-testid="unstandardized-residuals-checkbox"]');
    await page.check('[data-testid="standardized-residuals-checkbox"]');
    await page.check('[data-testid="adjusted-residuals-checkbox"]');
    await page.waitForTimeout(2000);
    
    // Execute analysis
    await page.click('button:has-text("OK")');
    await page.waitForTimeout(12000); // Allow more time for comprehensive analysis
    
    // Verify results are displayed
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    
    // Verify comprehensive analysis results
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    
    // Check for multiple result tables from comprehensive analysis
    const resultTables = page.locator('[data-testid^="result-table-"]');
    await expect(resultTables.first()).toBeVisible({ timeout: 15000 });
    
    // Collect performance metrics
    const metrics = await resourceMonitor.collectMetrics(page);
    console.log('Comprehensive options metrics:', {
      renderTime: `${metrics.renderTime}ms`,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      networkRequests: metrics.networkRequests,
      browserInfo: metrics.browserInfo
    });
    
    // Verify no errors occurred
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should validate performance thresholds', async ({ page }) => {
    resourceMonitor.startMonitoring();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Navigate to Crosstabs
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Crosstabs...');
    await page.waitForTimeout(2000);
    
    // Quick analysis setup
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="row-variables-list"]'));
    await page.waitForTimeout(500);
    
    const secondVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await secondVariable.dragTo(page.locator('[data-testid="column-variables-list"]'));
    await page.waitForTimeout(500);
    
    // Execute analysis
    await page.click('button:has-text("OK")');
    await page.waitForTimeout(8000);
    
    // Collect and validate metrics
    const metrics = await resourceMonitor.collectMetrics(page);
    const validation = resourceMonitor.validateThresholds(metrics);
    
    console.log('Performance validation:', {
      passed: validation.passed,
      violations: validation.violations,
      metrics: {
        renderTime: `${metrics.renderTime}ms`,
        memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        domNodes: metrics.domNodes,
        jsHeapSize: `${(metrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`
      }
    });
    
    // Assert performance thresholds
    expect(validation.passed).toBe(true);
    if (!validation.passed) {
      console.error('Performance threshold violations:', validation.violations);
    }
    
    // Verify no errors occurred
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should test tab navigation and settings persistence', async ({ page }) => {
    // Load dataset and open Crosstabs
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Crosstabs...');
    await page.waitForTimeout(2000);
    
    // Test Variables tab
    await expect(page.locator('[data-testid="crosstabs-variables-tab"]')).toBeVisible();
    await page.click('[data-testid="crosstabs-variables-tab"]');
    
    // Add variables
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="row-variables-list"]'));
    await page.waitForTimeout(1000);
    
    // Navigate to Cells tab
    await page.click('[data-testid="crosstabs-cells-tab"]');
    await expect(page.locator('[data-testid="crosstabs-cells-tab-content"]')).toBeVisible();
    
    // Configure some options
    await page.check('[data-testid="observed-counts-checkbox"]');
    await page.check('[data-testid="row-percentages-checkbox"]');
    
    // Go back to Variables tab and verify settings are preserved
    await page.click('[data-testid="crosstabs-variables-tab"]');
    await expect(page.locator('[data-testid="row-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
    
    // Go back to Cells tab and verify settings are preserved
    await page.click('[data-testid="crosstabs-cells-tab"]');
    await expect(page.locator('[data-testid="observed-counts-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="row-percentages-checkbox"]')).toBeChecked();
  });

  test('should configure statistics options', async ({ page }) => {
    resourceMonitor.startMonitoring();

    // Load dataset and open Crosstabs
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Crosstabs...');
    await page.waitForTimeout(2000);

    // Switch to Cells tab
    await page.click('[data-testid="crosstabs-cells-tab"]');
    await page.waitForSelector('[data-testid="crosstabs-cells-content"]');

    // Configure counts options
    await page.check('[data-testid="expected-counts-checkbox"]');
    await page.check('[data-testid="observed-counts-checkbox"]');

    // Configure percentages
    await page.check('[data-testid="row-percentages-checkbox"]');
    await page.check('[data-testid="column-percentages-checkbox"]');
    await page.check('[data-testid="total-percentages-checkbox"]');

    // Configure residuals
    await page.check('[data-testid="unstandardized-residuals-checkbox"]');
    await page.check('[data-testid="standardized-residuals-checkbox"]');
    await page.check('[data-testid="adjusted-residuals-checkbox"]');

    // Verify options are selected
    await expect(page.locator('[data-testid="expected-counts-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="observed-counts-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="row-percentages-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="column-percentages-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="total-percentages-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="unstandardized-residuals-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="standardized-residuals-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="adjusted-residuals-checkbox"]')).toBeChecked();

    // Collect performance metrics
    const metrics = await resourceMonitor.collectMetrics(page);
    console.log('Statistics Options Configuration Metrics:', {
      renderTime: `${metrics.renderTime}ms`,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      domNodes: metrics.domNodes
    });

    // Verify no errors occurred
     expect(jsErrors.length).toBe(0);
     expect(networkErrors.length).toBe(0);
   });

   test('should handle variable drag and drop operations', async ({ page }) => {
     resourceMonitor.startMonitoring();

     // Load dataset and open Crosstabs
     await page.click('button:has-text("File")');
     await page.waitForTimeout(1000);
     await page.click('text=Example Data');
     await page.waitForTimeout(2000);
     await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
     await page.click('button:has-text("accidents.sav")');
     await page.waitForTimeout(5000);
     
     await page.click('text=Analyze');
     await page.waitForTimeout(1000);
     await page.click('text=Descriptive Statistics');
     await page.waitForTimeout(1000);
     await page.click('text=Crosstabs...');
     await page.waitForTimeout(2000);

     // Verify Variables tab is active
     await expect(page.getByTestId('crosstabs-variables-content')).toBeVisible();
     await expect(page.getByTestId('crosstabs-variable-lists-container')).toBeVisible();

     // Test variable list manager functionality
     await expect(page.getByTestId('crosstabs-variable-list-manager')).toBeVisible();

     // Verify tour overlays are present
     await expect(page.getByTestId('crosstabs-available-variables-overlay')).toBeVisible();
     await expect(page.getByTestId('crosstabs-row-variables-overlay')).toBeVisible();
     await expect(page.getByTestId('crosstabs-column-variables-overlay')).toBeVisible();

     const metrics = await resourceMonitor.collectMetrics(page);
     console.log('Variable Operations Metrics:', {
       renderTime: `${metrics.renderTime}ms`,
       memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
       domNodes: metrics.domNodes
     });

     expect(jsErrors.length).toBe(0);
     expect(networkErrors.length).toBe(0);
   });

   test('should handle reset functionality', async ({ page }) => {
     resourceMonitor.startMonitoring();

     // Load dataset and open Crosstabs
     await page.click('button:has-text("File")');
     await page.waitForTimeout(1000);
     await page.click('text=Example Data');
     await page.waitForTimeout(2000);
     await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
     await page.click('button:has-text("accidents.sav")');
     await page.waitForTimeout(5000);
     
     await page.click('text=Analyze');
     await page.waitForTimeout(1000);
     await page.click('text=Descriptive Statistics');
     await page.waitForTimeout(1000);
     await page.click('text=Crosstabs...');
     await page.waitForTimeout(2000);

     // Configure some options first
     await page.click('[data-testid="crosstabs-cells-tab"]');
     await page.waitForSelector('[data-testid="crosstabs-cells-content"]');
     await page.check('[data-testid="crosstabs-expected-checkbox"]');
     await page.check('[data-testid="crosstabs-row-percentages-checkbox"]');

     // Test reset button
     await page.click('[data-testid="crosstabs-reset-button"]');
     await page.waitForTimeout(1000);

     // Verify options are reset
     await expect(page.getByTestId('crosstabs-expected-checkbox')).not.toBeChecked();
     await expect(page.getByTestId('crosstabs-row-percentages-checkbox')).not.toBeChecked();

     const metrics = await resourceMonitor.collectMetrics(page);
     console.log('Reset Functionality Metrics:', {
       renderTime: `${metrics.renderTime}ms`,
       memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
       domNodes: metrics.domNodes
     });

     expect(jsErrors.length).toBe(0);
     expect(networkErrors.length).toBe(0);
   });

   test('should handle help button functionality', async ({ page }) => {
     resourceMonitor.startMonitoring();

     // Load dataset and open Crosstabs
     await page.click('button:has-text("File")');
     await page.waitForTimeout(1000);
     await page.click('text=Example Data');
     await page.waitForTimeout(2000);
     await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
     await page.click('button:has-text("accidents.sav")');
     await page.waitForTimeout(5000);
     
     await page.click('text=Analyze');
     await page.waitForTimeout(1000);
     await page.click('text=Descriptive Statistics');
     await page.waitForTimeout(1000);
     await page.click('text=Crosstabs...');
     await page.waitForTimeout(2000);

     // Test help button
     await expect(page.getByTestId('crosstabs-help-button')).toBeVisible();
     await page.click('[data-testid="crosstabs-help-button"]');
     await page.waitForTimeout(1000);

     // Verify footer and action buttons are present
     await expect(page.getByTestId('crosstabs-footer')).toBeVisible();
     await expect(page.getByTestId('crosstabs-action-buttons')).toBeVisible();
     await expect(page.getByTestId('crosstabs-cancel-button')).toBeVisible();
     await expect(page.getByTestId('crosstabs-ok-button')).toBeVisible();

     const metrics = await resourceMonitor.collectMetrics(page);
     console.log('Help Button Functionality Metrics:', {
       renderTime: `${metrics.renderTime}ms`,
       memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
       domNodes: metrics.domNodes
     });

     expect(jsErrors.length).toBe(0);
     expect(networkErrors.length).toBe(0);
   });

   test('should handle comprehensive crosstabs workflow', async ({ page }) => {
     resourceMonitor.startMonitoring();

     // Load dataset and open Crosstabs
     await page.click('button:has-text("File")');
     await page.waitForTimeout(1000);
     await page.click('text=Example Data');
     await page.waitForTimeout(2000);
     await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
     await page.click('button:has-text("accidents.sav")');
     await page.waitForTimeout(5000);
     
     await page.click('text=Analyze');
     await page.waitForTimeout(1000);
     await page.click('text=Descriptive Statistics');
     await page.waitForTimeout(1000);
     await page.click('text=Crosstabs...');
     await page.waitForTimeout(2000);

     // Verify main container
     await expect(page.getByTestId('crosstabs-dialog-container')).toBeVisible();
     await expect(page.getByTestId('crosstabs-dialog-header')).toBeVisible();
     await expect(page.getByTestId('crosstabs-dialog-title')).toBeVisible();
     await expect(page.getByTestId('crosstabs-dialog-content')).toBeVisible();

     // Test tab navigation
     await expect(page.getByTestId('crosstabs-tabs')).toBeVisible();
     await expect(page.getByTestId('crosstabs-tabs-list')).toBeVisible();
     await expect(page.getByTestId('crosstabs-variables-tab')).toBeVisible();
     await expect(page.getByTestId('crosstabs-cells-tab')).toBeVisible();

     // Test Variables tab
     await page.click('[data-testid="crosstabs-variables-tab"]');
     await expect(page.getByTestId('crosstabs-variables-content')).toBeVisible();
     await expect(page.getByTestId('crosstabs-variables-tab-content')).toBeVisible();

     // Test Cells tab
     await page.click('[data-testid="crosstabs-cells-tab"]');
     await expect(page.getByTestId('crosstabs-cells-content')).toBeVisible();
     await expect(page.getByTestId('crosstabs-cells-tab-content')).toBeVisible();
     await expect(page.getByTestId('crosstabs-cells-options-grid')).toBeVisible();

     // Test all sections are visible
     await expect(page.getByTestId('crosstabs-counts-section')).toBeVisible();
     await expect(page.getByTestId('crosstabs-percentages-section')).toBeVisible();
     await expect(page.getByTestId('crosstabs-residuals-section')).toBeVisible();

     // Configure comprehensive options
     await page.check('[data-testid="crosstabs-observed-checkbox"]');
     await page.check('[data-testid="crosstabs-expected-checkbox"]');
     await page.check('[data-testid="crosstabs-hide-small-counts-checkbox"]');
     await page.fill('[data-testid="crosstabs-hide-small-counts-threshold"]', '5');
     
     await page.check('[data-testid="crosstabs-row-percentages-checkbox"]');
     await page.check('[data-testid="crosstabs-column-percentages-checkbox"]');
     await page.check('[data-testid="crosstabs-total-percentages-checkbox"]');
     
     await page.check('[data-testid="crosstabs-unstandardized-residuals-checkbox"]');
     await page.check('[data-testid="crosstabs-standardized-residuals-checkbox"]');
     await page.check('[data-testid="crosstabs-adjusted-residuals-checkbox"]');

     // Verify all options are configured
     await expect(page.getByTestId('crosstabs-observed-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-expected-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-hide-small-counts-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-hide-small-counts-threshold')).toHaveValue('5');
     
     await expect(page.getByTestId('crosstabs-row-percentages-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-column-percentages-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-total-percentages-checkbox')).toBeChecked();
     
     await expect(page.getByTestId('crosstabs-unstandardized-residuals-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-standardized-residuals-checkbox')).toBeChecked();
     await expect(page.getByTestId('crosstabs-adjusted-residuals-checkbox')).toBeChecked();

     const metrics = await resourceMonitor.collectMetrics(page);
     console.log('Comprehensive Workflow Metrics:', {
       renderTime: `${metrics.renderTime}ms`,
       memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
       domNodes: metrics.domNodes
     });

     expect(jsErrors.length).toBe(0);
     expect(networkErrors.length).toBe(0);
   });
 });