import { test, expect } from '@playwright/test';

// Performance and Resource Monitoring Interface
interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  errorRate: number;
  cpuUsage?: number;
  networkRequests: number;
  networkLatency: number;
  domNodes: number;
  jsHeapSize: number;
  loadTime: number;
  interactionTime: number;
  // Web Vitals metrics
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  // Application-specific metrics
  datasetLoadTime: number;
  analysisComputationTime: number;
  chartRenderTime: number;
  dataExportTime: number;
  // Cross-browser specific metrics
  browserInfo: {
    name: string;
    version: string;
    platform: string;
  };
}

// Resource monitoring helper functions
class ResourceMonitor {
  private startTime: number = 0;
  private currentMetrics: PerformanceMetrics = {
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    errorRate: 0,
    networkRequests: 0,
    networkLatency: 0,
    domNodes: 0,
    jsHeapSize: 0,
    loadTime: 0,
    interactionTime: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    datasetLoadTime: 0,
    analysisComputationTime: 0,
    chartRenderTime: 0,
    dataExportTime: 0,
    browserInfo: {
      name: 'unknown',
      version: 'unknown',
      platform: 'unknown'
    }
  };
  private metricsHistory: PerformanceMetrics[] = [];

  startMonitoring() {
    this.startTime = Date.now();
  }

  async collectMetrics(page: any): Promise<PerformanceMetrics> {
    try {
      // Collect browser performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const memory = (performance as any).memory;
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
          jsHeapSize: memory ? memory.usedJSHeapSize : 0,
          jsHeapSizeLimit: memory ? memory.totalJSHeapSize : 0,
          domNodes: document.querySelectorAll('*').length,
          resourceCount: performance.getEntriesByType('resource').length,
          // Browser-specific information
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          devicePixelRatio: window.devicePixelRatio || 1
        };
      });
      
      // Get browser context information
      const browserContext = page.context();
      const browser = browserContext.browser();
      const browserName = browser?.browserType()?.name() || 'unknown';
      const browserVersion = browser?.version() || 'unknown';

      // Collect network metrics
      const networkMetrics = await this.collectNetworkMetrics(page);
      
      // Update metrics
      this.currentMetrics = {
        renderTime: performanceMetrics.firstContentfulPaint,
        updateTime: 0,
        memoryUsage: performanceMetrics.jsHeapSize,
        errorRate: 0,
        networkRequests: performanceMetrics.resourceCount,
        networkLatency: networkMetrics.averageLatency,
        domNodes: performanceMetrics.domNodes,
        jsHeapSize: performanceMetrics.jsHeapSize,
        loadTime: performanceMetrics.loadTime,
        interactionTime: Date.now() - this.startTime,
        firstPaint: performanceMetrics.firstPaint,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        largestContentfulPaint: performanceMetrics.largestContentfulPaint,
        datasetLoadTime: 0, // Will be set by test code when loading datasets
        analysisComputationTime: 0, // Will be set by test code when running analysis
        chartRenderTime: 0, // Will be set by test code when rendering charts
        dataExportTime: 0, // Will be set by test code when exporting data
        browserInfo: {
          name: browserName,
          version: browserVersion,
          platform: 'unknown'
        }
      };

      // Add to history
      this.metricsHistory.push({...this.currentMetrics});
      return this.currentMetrics;
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
      return this.currentMetrics;
    }
  }

  private async collectNetworkMetrics(page: any) {
    try {
      const resourceTimings: any[] = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((entry: any) => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          responseStart: entry.responseStart,
          requestStart: entry.requestStart
        }));
      });
      
      const totalLatency = resourceTimings.reduce((sum: number, resource: any) => {
        if (resource.requestStart && resource.responseStart) {
          return sum + (resource.responseStart - resource.requestStart);
        }
        return sum;
      }, 0);
      
      const averageLatency = resourceTimings.length > 0 ? totalLatency / resourceTimings.length : 0;
      
      return {
        resourceCount: resourceTimings.length,
        averageLatency,
        totalTransferSize: resourceTimings.reduce((sum: number, resource: any) => sum + (resource.transferSize || 0), 0)
      };
    } catch (error) {
      console.warn('Failed to collect network metrics:', error);
      return {
        resourceCount: 0,
        averageLatency: 0,
        totalTransferSize: 0
      };
    }
  }

  logMetrics(testName: string) {
    console.log(`\n=== Performance Metrics for: ${testName} ===`);
    console.log(`Browser: ${this.currentMetrics.browserInfo.name} v${this.currentMetrics.browserInfo.version}`);
    console.log('--- Performance Metrics ---');
    console.log(`Load Time: ${this.currentMetrics.loadTime.toFixed(2)}ms`);
    console.log(`Render Time (FCP): ${this.currentMetrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`First Paint: ${this.currentMetrics.firstPaint.toFixed(2)}ms`);
    if (this.currentMetrics.largestContentfulPaint) {
      console.log(`Largest Contentful Paint: ${this.currentMetrics.largestContentfulPaint.toFixed(2)}ms`);
    }
    console.log(`Interaction Time: ${this.currentMetrics.interactionTime}ms`);
    console.log(`JS Heap Size: ${(this.currentMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${this.currentMetrics.domNodes}`);
    console.log(`Network Requests: ${this.currentMetrics.networkRequests}`);
    console.log(`Average Network Latency: ${this.currentMetrics.networkLatency.toFixed(2)}ms`);
    console.log(`Dataset Load Time: ${this.currentMetrics.datasetLoadTime}ms`);
    console.log(`Analysis Computation Time: ${this.currentMetrics.analysisComputationTime}ms`);
    console.log(`Chart Render Time: ${this.currentMetrics.chartRenderTime}ms`);
    console.log(`Data Export Time: ${this.currentMetrics.dataExportTime}ms`);
    console.log('===============================\n');
  }

  validatePerformance(): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    const thresholds = this.getBrowserSpecificThresholds();
    
    // Standard performance validations
    if (this.currentMetrics.loadTime > thresholds.loadTime) {
      issues.push(`Load time ${this.currentMetrics.loadTime.toFixed(2)}ms exceeds threshold ${thresholds.loadTime}ms`);
    }
    
    if (this.currentMetrics.firstContentfulPaint > thresholds.renderTime) {
      issues.push(`Render time ${this.currentMetrics.firstContentfulPaint.toFixed(2)}ms exceeds threshold ${thresholds.renderTime}ms`);
    }
    
    if (this.currentMetrics.jsHeapSize > thresholds.jsHeapSize) {
      issues.push(`JS Heap size ${(this.currentMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB exceeds threshold ${thresholds.jsHeapSize / 1024 / 1024}MB`);
    }
    
    if (this.currentMetrics.domNodes > thresholds.domNodes) {
      issues.push(`DOM nodes ${this.currentMetrics.domNodes} exceeds threshold ${thresholds.domNodes}`);
    }
    
    if (this.currentMetrics.networkLatency > thresholds.networkLatency) {
      issues.push(`Network latency ${this.currentMetrics.networkLatency.toFixed(2)}ms exceeds threshold ${thresholds.networkLatency}ms`);
    }
    
    // Application-specific validations
    if (this.currentMetrics.datasetLoadTime > 10000) { // 10 seconds
      issues.push(`Dataset load time ${this.currentMetrics.datasetLoadTime}ms exceeds threshold 10000ms`);
    }
    
    if (this.currentMetrics.analysisComputationTime > 30000) { // 30 seconds
      issues.push(`Analysis computation time ${this.currentMetrics.analysisComputationTime}ms exceeds threshold 30000ms`);
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  validateThresholds(metric: PerformanceMetrics): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (metric.renderTime > 3000) {
      violations.push(`Render time exceeded: ${metric.renderTime}ms > 3000ms`);
    }
    if (metric.memoryUsage > 100 * 1024 * 1024) { // 100MB
      violations.push(`Memory usage exceeded: ${metric.memoryUsage} > ${100 * 1024 * 1024}`);
    }
    if (metric.networkLatency > 2000) {
      violations.push(`Network latency exceeded: ${metric.networkLatency}ms > 2000ms`);
    }
    if (metric.domNodes > 5000) {
      violations.push(`DOM nodes exceeded: ${metric.domNodes} > 5000`);
    }
    if (metric.jsHeapSize > 50 * 1024 * 1024) { // 50MB
      violations.push(`JS heap size exceeded: ${metric.jsHeapSize} > ${50 * 1024 * 1024}`);
    }
    if (metric.loadTime > 5000) {
      violations.push(`Load time exceeded: ${metric.loadTime}ms > 5000ms`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  private getBrowserSpecificThresholds() {
    // Browser-specific performance thresholds
    switch (this.currentMetrics.browserInfo.name) {
      case 'chromium':
        return {
          loadTime: 3000,
          renderTime: 2000,
          jsHeapSize: 50 * 1024 * 1024, // 50MB
          domNodes: 1500,
          networkLatency: 1000
        };
      case 'firefox':
        return {
          loadTime: 3000,
          renderTime: 2500,
          jsHeapSize: 60 * 1024 * 1024, // 60MB
          domNodes: 1500,
          networkLatency: 1000
        };
      case 'webkit':
        return {
          loadTime: 3500,
          renderTime: 2000,
          jsHeapSize: 40 * 1024 * 1024, // 40MB
          domNodes: 1500,
          networkLatency: 1000
        };
      default:
        return {
          loadTime: 5000,
          renderTime: 3000,
          jsHeapSize: 100 * 1024 * 1024, // 100MB
          domNodes: 2000,
          networkLatency: 2000
        };
    }
  }

  /**
   * Mendapatkan ringkasan statistik dari semua metrik yang dikumpulkan
   */
  getStatistics() {
    if (this.metricsHistory.length === 0) return null;

    const stats = {
      count: this.metricsHistory.length,
      averageRenderTime: this.metricsHistory.reduce((sum, m) => sum + m.renderTime, 0) / this.metricsHistory.length,
      averageMemoryUsage: this.metricsHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metricsHistory.length,
      averageNetworkLatency: this.metricsHistory.reduce((sum, m) => sum + m.networkLatency, 0) / this.metricsHistory.length,
      maxRenderTime: Math.max(...this.metricsHistory.map(m => m.renderTime)),
      maxMemoryUsage: Math.max(...this.metricsHistory.map(m => m.memoryUsage)),
      totalNetworkRequests: this.metricsHistory.reduce((sum, m) => sum + m.networkRequests, 0)
    };

    return stats;
  }

  /**
   * Mereset semua metrik yang dikumpulkan
   */
  reset(): void {
    this.metricsHistory = [];
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
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Verify dataset is loaded
    await expect(page.locator('[data-testid="example-dataset-accidents"]')).toBeVisible();
    
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
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
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
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
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
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
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
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
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
     await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
     await page.click('[data-testid="example-dataset-accidents"]');
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
     await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
     await page.click('[data-testid="example-dataset-accidents"]');
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
     await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
     await page.click('[data-testid="example-dataset-accidents"]');
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
     await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
     await page.click('[data-testid="example-dataset-accidents"]');
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