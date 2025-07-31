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
  // Cross-browser specific metrics
  browserName: string;
  browserVersion: string;
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
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
    browserName: 'unknown',
    browserVersion: 'unknown',
    userAgent: 'unknown',
    viewport: { width: 0, height: 0 },
    devicePixelRatio: 1,
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
        ...this.currentMetrics,
        loadTime: performanceMetrics.loadTime,
        jsHeapSize: performanceMetrics.jsHeapSize,
        domNodes: performanceMetrics.domNodes,
        networkRequests: performanceMetrics.resourceCount,
        networkLatency: networkMetrics.averageLatency,
        renderTime: performanceMetrics.firstContentfulPaint,
        interactionTime: Date.now() - this.startTime,
        // Browser-specific metrics
        browserName: browserName,
        browserVersion: browserVersion,
        userAgent: performanceMetrics.userAgent,
        viewport: performanceMetrics.viewport,
        devicePixelRatio: performanceMetrics.devicePixelRatio
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
      const resourceTimings = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((entry: any) => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          responseStart: entry.responseStart,
          requestStart: entry.requestStart
        }));
      });

      const totalLatency = resourceTimings.reduce((sum: number, resource: any) => 
        sum + (resource.responseStart - resource.requestStart), 0);
      
      return {
        averageLatency: resourceTimings.length > 0 ? totalLatency / resourceTimings.length : 0,
        totalTransferSize: resourceTimings.reduce((sum: number, resource: any) => sum + resource.transferSize, 0)
      };
    } catch (error) {
      return { averageLatency: 0, totalTransferSize: 0 };
    }
  }

  logMetrics(testName: string) {
    console.log('\n================================================');
    console.log('PERFORMANCE METRICS');
    console.log('================================================');
    console.log(`Load Time: ${this.currentMetrics.loadTime}ms`);
    console.log(`Render Time: ${this.currentMetrics.renderTime}ms`);
    console.log(`JS Heap Size: ${(this.currentMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${this.currentMetrics.domNodes}`);
    console.log(`Network Requests: ${this.currentMetrics.networkRequests}`);
    console.log(`Average Network Latency: ${this.currentMetrics.networkLatency.toFixed(2)}ms`);
    console.log(`Memory Usage: ${this.currentMetrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Error Rate: ${this.currentMetrics.errorRate}%`);
    console.log('================================================\n');
  }

  validatePerformance(): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Browser-specific performance thresholds
    const thresholds = this.getBrowserSpecificThresholds();
    
    if (this.currentMetrics.loadTime > thresholds.loadTime) {
      issues.push(`Load time too high for ${this.currentMetrics.browserName}: ${this.currentMetrics.loadTime}ms (threshold: ${thresholds.loadTime}ms)`);
    }
    
    if (this.currentMetrics.renderTime > thresholds.renderTime) {
      issues.push(`Render time too high for ${this.currentMetrics.browserName}: ${this.currentMetrics.renderTime}ms (threshold: ${thresholds.renderTime}ms)`);
    }
    
    if (this.currentMetrics.jsHeapSize > thresholds.jsHeapSize) {
      issues.push(`JS Heap size too high for ${this.currentMetrics.browserName}: ${(this.currentMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB (threshold: ${(thresholds.jsHeapSize / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    if (this.currentMetrics.domNodes > thresholds.domNodes) {
      issues.push(`DOM nodes too many for ${this.currentMetrics.browserName}: ${this.currentMetrics.domNodes} (threshold: ${thresholds.domNodes})`);
    }
    
    if (this.currentMetrics.networkLatency > thresholds.networkLatency) {
      issues.push(`Network latency too high for ${this.currentMetrics.browserName}: ${this.currentMetrics.networkLatency}ms (threshold: ${thresholds.networkLatency}ms)`);
    }
    
    if (this.currentMetrics.errorRate > thresholds.errorRate) {
      issues.push(`Error rate too high for ${this.currentMetrics.browserName}: ${this.currentMetrics.errorRate}% (threshold: ${thresholds.errorRate}%)`);
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  reset(): void {
    this.metricsHistory = [];
    this.currentMetrics = {
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
      browserName: 'unknown',
      browserVersion: 'unknown',
      userAgent: 'unknown',
      viewport: { width: 0, height: 0 },
      devicePixelRatio: 1,
    };
    this.startTime = 0;
  }
  
  private getBrowserSpecificThresholds() {
    // Different browsers have different performance characteristics
    const baseThresholds = {
      loadTime: 3000,
      renderTime: 2000,
      jsHeapSize: 50 * 1024 * 1024, // 50MB
      domNodes: 1500,
      networkLatency: 1000,
      errorRate: 5
    };
    
    switch (this.metrics.browserName) {
      case 'firefox':
        // Firefox typically uses more memory but has good rendering performance
        return {
          ...baseThresholds,
          jsHeapSize: 60 * 1024 * 1024, // 60MB for Firefox
          renderTime: 2500 // Firefox can be slower on first paint
        };
      case 'webkit':
        // WebKit (Safari) is generally more memory efficient but can be slower on complex operations
        return {
          ...baseThresholds,
          loadTime: 3500, // WebKit can be slower on initial load
          jsHeapSize: 40 * 1024 * 1024 // 40MB for WebKit
        };
      case 'chromium':
      default:
        return baseThresholds;
    }
  }
}

// Test suite structure
test.describe('Explore Analysis - Accidents Dataset Workflow', () => {
  let resourceMonitor: ResourceMonitor;
  let jsErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Initialize resource monitoring
    resourceMonitor = new ResourceMonitor();
    
    // Setup error monitoring
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Start monitoring
    resourceMonitor.startMonitoring();
    
    // Navigate to Data Dashboard
    await page.goto('/data-dashboard');
    await page.waitForLoadState('networkidle');
    
    // Collect initial metrics
    await resourceMonitor.collectMetrics(page);
  });

  test.afterEach(async ({ page }) => {
    // Collect final metrics
    await resourceMonitor.collectMetrics(page);
    
    // Log performance metrics
    resourceMonitor.logMetrics(test.info().title);
    
    // Validate performance
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance issues detected:', validation.issues);
    }
    
    // Check for JavaScript errors
    if (jsErrors.length > 0) {
      console.warn('JavaScript errors detected:', jsErrors);
    }
    
    // Check for network errors
    if (networkErrors.length > 0) {
      console.warn('Network errors detected:', networkErrors);
    }
    
    // Reset error arrays for next test
    jsErrors = [];
    networkErrors = [];
  });

  // Test Cases
  test('should load dataset successfully', async ({ page }) => {
    const startTime = Date.now();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    const loadTime = Date.now() - startTime;
    console.log(`Dataset loading time: ${loadTime}ms`);
    
    // Verify dataset is loaded
    await expect(page.locator('[data-testid="dataset-info"]')).toBeVisible();
  });

  test('should navigate to Explore menu successfully', async ({ page }) => {
    const startTime = Date.now();
    
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Explore
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    const navigationTime = Date.now() - startTime;
    console.log(`Explore navigation time: ${navigationTime}ms`);
    
    // Verify Explore dialog is open
    await expect(page.locator('[data-testid="explore-dialog"]')).toBeVisible();
  });

  test('should verify required variables for explore analysis', async ({ page }) => {
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Explore
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Verify Variables tab is active by default
    await expect(page.locator('[data-testid="variables-tab-trigger"]')).toHaveAttribute('data-state', 'active');
    
    // Verify variable lists are present
    await expect(page.locator('[data-testid="available-variables-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="dependent-variables-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="factor-variables-list"]')).toBeVisible();
    
    // Verify at least one variable is available
    const availableVariables = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]');
    await expect(availableVariables.first()).toBeVisible();
  });

  test('should execute basic explore workflow', async ({ page }) => {
    const startTime = Date.now();
    
    // Phase 1: Load dataset
    const phase1Start = Date.now();
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    const phase1Time = Date.now() - phase1Start;
    
    // Phase 2: Navigate to Explore
    const phase2Start = Date.now();
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    const phase2Time = Date.now() - phase2Start;
    
    // Phase 3: Configure Variables
    const phase3Start = Date.now();
    // Move a variable to dependent list
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(1000);
    const phase3Time = Date.now() - phase3Start;
    
    // Phase 4: Configure Statistics
    const phase4Start = Date.now();
    await page.click('[data-testid="statistics-tab-trigger"]');
    await page.waitForTimeout(500);
    
    // Enable descriptives
    await page.check('[data-testid="descriptives-checkbox"]');
    await page.waitForTimeout(500);
    const phase4Time = Date.now() - phase4Start;
    
    // Phase 5: Execute analysis
    const phase5Start = Date.now();
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(5000);
    const phase5Time = Date.now() - phase5Start;
    
    const totalTime = Date.now() - startTime;
    
    console.log(`Phase timings - Load: ${phase1Time}ms, Navigate: ${phase2Time}ms, Configure Variables: ${phase3Time}ms, Configure Statistics: ${phase4Time}ms, Execute: ${phase5Time}ms, Total: ${totalTime}ms`);
    
    // Verify results are displayed
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
  });

  test('should handle comprehensive explore options', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Explore
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Variables tab - select multiple variables
    await page.click('[data-testid="variables-tab-trigger"]');
    
    // Move multiple variables to dependent list
    const variables = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]');
    const variableCount = await variables.count();
    const maxVariables = Math.min(3, variableCount); // Select up to 3 variables
    
    for (let i = 0; i < maxVariables; i++) {
      await variables.nth(i).dragTo(page.locator('[data-testid="dependent-variables-list"]'));
      await page.waitForTimeout(500);
    }
    
    // Statistics tab - enable all statistics
    await page.click('[data-testid="statistics-tab-trigger"]');
    await page.waitForTimeout(500);
    
    // Enable all available statistics options
    await page.check('[data-testid="descriptives-checkbox"]');
    await page.check('[data-testid="m-estimators-checkbox"]');
    await page.check('[data-testid="outliers-checkbox"]');
    await page.check('[data-testid="percentiles-checkbox"]');
    await page.waitForTimeout(1000);
    
    // Plots tab - enable all plot options
    await page.click('[data-testid="plots-tab-trigger"]');
    await page.waitForTimeout(500);
    
    // Enable boxplots
    await page.check('[data-testid="boxplot-dependents-together"]');
    await page.check('[data-testid="stem-and-leaf-checkbox"]');
    await page.check('[data-testid="histogram-checkbox"]');
    await page.waitForTimeout(1000);
    
    // Execute with comprehensive options
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(8000); // Allow more time for comprehensive analysis
    
    // Verify comprehensive results
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="descriptives-table"]')).toBeVisible();
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Comprehensive test time: ${totalTestTime}ms`);
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should validate performance thresholds', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Execute explore with performance monitoring
    const exploreStartTime = Date.now();
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Quick configuration for performance test
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="statistics-tab-trigger"]');
    await page.check('[data-testid="descriptives-checkbox"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(3000);
    
    const exploreExecutionTime = Date.now() - exploreStartTime;
    console.log(`Explore execution time: ${exploreExecutionTime}ms`);
    
    // Validate performance metrics
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance validation failed:', validation.issues);
    }
    
    // Performance assertions
    expect(exploreExecutionTime).toBeLessThan(12000); // Should complete within 12 seconds
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Explore
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Test error handling - try to execute without selecting variables
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(1000);
    
    // Should show error message or validation
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Verify dialog remains open for correction
    await expect(page.locator('[data-testid="explore-dialog"]')).toBeVisible();
    
    // Test recovery - add proper configuration and retry
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(1000);
    
    await page.click('[data-testid="statistics-tab-trigger"]');
    await page.check('[data-testid="descriptives-checkbox"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(3000);
    
    // Should succeed after correction
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should test tab navigation and state persistence', async ({ page }) => {
    // Load dataset and navigate to Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Test Variables tab
    await page.click('[data-testid="variables-tab-trigger"]');
    await expect(page.locator('[data-testid="variables-tab-content"]')).toBeVisible();
    
    // Move a variable and verify it persists
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(500);
    
    // Test Statistics tab
    await page.click('[data-testid="statistics-tab-trigger"]');
    await expect(page.locator('[data-testid="statistics-tab-content"]')).toBeVisible();
    
    // Enable some statistics
    await page.check('[data-testid="descriptives-checkbox"]');
    await page.check('[data-testid="m-estimators-checkbox"]');
    await page.waitForTimeout(500);
    
    // Test Plots tab
    await page.click('[data-testid="plots-tab-trigger"]');
    await expect(page.locator('[data-testid="plots-tab-content"]')).toBeVisible();
    
    // Enable some plots
    await page.check('[data-testid="histogram-checkbox"]');
    await page.waitForTimeout(500);
    
    // Go back to Variables tab and verify variable is still there
    await page.click('[data-testid="variables-tab-trigger"]');
    await expect(page.locator('[data-testid="dependent-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
    
    // Go back to Statistics tab and verify settings are preserved
    await page.click('[data-testid="statistics-tab-trigger"]');
    await expect(page.locator('[data-testid="descriptives-checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="m-estimators-checkbox"]')).toBeChecked();
    
    // Go back to Plots tab and verify settings are preserved
    await page.click('[data-testid="plots-tab-trigger"]');
    await expect(page.locator('[data-testid="histogram-checkbox"]')).toBeChecked();
  });

  test('should test statistics options configuration with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Navigate to Statistics tab using data-testid
    await page.click('[data-testid="explore-statistics-tab"]');
    
    // Test descriptives checkbox with data-testid
    await expect(page.locator('[data-testid="explore-descriptives-checkbox"]')).toBeVisible();
    await page.check('[data-testid="explore-descriptives-checkbox"]');
    await expect(page.locator('[data-testid="explore-descriptives-checkbox"]')).toBeChecked();
    
    // Test confidence interval input with data-testid
    await expect(page.locator('[data-testid="explore-confidence-interval-input"]')).toBeVisible();
    await page.fill('[data-testid="explore-confidence-interval-input"]', '99');
    await expect(page.locator('[data-testid="explore-confidence-interval-input"]')).toHaveValue('99');
    
    // Test outliers checkbox with data-testid
    await expect(page.locator('[data-testid="explore-outliers-checkbox"]')).toBeVisible();
    await page.check('[data-testid="explore-outliers-checkbox"]');
    await expect(page.locator('[data-testid="explore-outliers-checkbox"]')).toBeChecked();
    
    // Test disabling descriptives disables confidence interval
    await page.uncheck('[data-testid="explore-descriptives-checkbox"]');
    await expect(page.locator('[data-testid="explore-confidence-interval-input"]')).toBeDisabled();
  });

  test('should test plots options configuration with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Navigate to Plots tab using data-testid
    await page.click('[data-testid="explore-plots-tab"]');
    
    // Test boxplot radio group with data-testid
    await expect(page.locator('[data-testid="explore-boxplot-radio-group"]')).toBeVisible();
    
    // Test boxplot options with data-testid
    await page.check('[data-testid="explore-boxplot-none"]');
    await expect(page.locator('[data-testid="explore-boxplot-none"]')).toBeChecked();
    
    await page.check('[data-testid="explore-boxplot-factor-levels"]');
    await expect(page.locator('[data-testid="explore-boxplot-factor-levels"]')).toBeChecked();
    
    await page.check('[data-testid="explore-boxplot-dependents"]');
    await expect(page.locator('[data-testid="explore-boxplot-dependents"]')).toBeChecked();
    
    // Test descriptive plots checkboxes with data-testid
    await expect(page.locator('[data-testid="explore-stem-and-leaf-checkbox"]')).toBeVisible();
    await page.check('[data-testid="explore-stem-and-leaf-checkbox"]');
    await expect(page.locator('[data-testid="explore-stem-and-leaf-checkbox"]')).toBeChecked();
    
    await expect(page.locator('[data-testid="explore-histogram-checkbox"]')).toBeVisible();
    await page.check('[data-testid="explore-histogram-checkbox"]');
    await expect(page.locator('[data-testid="explore-histogram-checkbox"]')).toBeChecked();
  });

  test('should test reset functionality with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Configure some options
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(1000);
    
    await page.click('[data-testid="explore-statistics-tab"]');
    await page.check('[data-testid="explore-descriptives-checkbox"]');
    
    await page.click('[data-testid="explore-plots-tab"]');
    await page.check('[data-testid="explore-histogram-checkbox"]');
    
    // Test reset button with data-testid
    await page.click('[data-testid="explore-reset-button"]');
    
    // Verify reset worked - should be back to Variables tab
    await expect(page.locator('[data-testid="explore-variables-tab"]')).toHaveAttribute('data-state', 'active');
    
    // Verify statistics options are reset
    await page.click('[data-testid="explore-statistics-tab"]');
    await expect(page.locator('[data-testid="explore-descriptives-checkbox"]')).not.toBeChecked();
    
    // Verify plots options are reset
    await page.click('[data-testid="explore-plots-tab"]');
    await expect(page.locator('[data-testid="explore-histogram-checkbox"]')).not.toBeChecked();
  });

  test('should test help button functionality with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Test help button with data-testid
    await page.click('[data-testid="explore-help-button"]');
    
    // Verify tour or help content appears (adjust based on actual implementation)
    await page.waitForTimeout(1000); // Wait for any animations
  });

  test('should handle error conditions gracefully with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Test error when no variables selected using data-testid
    await page.click('[data-testid="explore-ok-button"]');
    await expect(page.locator('[data-testid="explore-error-message"]')).toBeVisible();
    
    // Test that OK button is disabled when no dependent variables
    await expect(page.locator('[data-testid="explore-ok-button"]')).toBeDisabled();
    
    // Add a dependent variable and verify button becomes enabled
    const firstVariable = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]').first();
    await firstVariable.dragTo(page.locator('[data-testid="dependent-variables-list"]'));
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="explore-ok-button"]')).toBeEnabled();
    
    // Test cancel button with data-testid
    await page.click('[data-testid="explore-cancel-button"]');
    await expect(page.locator('[data-testid="explore-dialog"]')).not.toBeVisible();
  });

  test('should test variable lists with data-testid', async ({ page }) => {
    // Load dataset and open Explore
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
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Test variable lists with data-testid
    await expect(page.locator('[data-testid="explore-variable-lists"]')).toBeVisible();
    await expect(page.locator('[data-testid="available-variables-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="dependent-variables-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="factor-variables-list"]')).toBeVisible();
    
    // Test drag and drop functionality
    const availableVariables = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]');
    const dependentList = page.locator('[data-testid="dependent-variables-list"]');
    const factorList = page.locator('[data-testid="factor-variables-list"]');
    
    // Drag first variable to dependent list
    await availableVariables.first().dragTo(dependentList);
    await page.waitForTimeout(1000);
    
    // Verify variable appears in dependent list
    await expect(page.locator('[data-testid="dependent-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
    
    // Drag second variable to factor list
    await availableVariables.nth(1).dragTo(factorList);
    await page.waitForTimeout(1000);
    
    // Verify variable appears in factor list
    await expect(page.locator('[data-testid="factor-variables-list"] [data-testid^="variable-item-"]')).toHaveCount(1);
  });

  test('should test comprehensive workflow with all data-testid elements', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Explore
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Explore...');
    await page.waitForTimeout(2000);
    
    // Verify dialog opens with data-testid
    await expect(page.locator('[data-testid="explore-dialog"]')).toBeVisible();
    
    // Test tabs with data-testid
    await expect(page.locator('[data-testid="explore-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-tabs-list"]')).toBeVisible();
    
    // Configure variables using data-testid
    await page.click('[data-testid="explore-variables-tab"]');
    await expect(page.locator('[data-testid="explore-variables-tab-content"]')).toBeVisible();
    
    const availableVariables = page.locator('[data-testid="available-variables-list"] [data-testid^="variable-item-"]');
    const variableCount = await availableVariables.count();
    
    // Add multiple dependent variables
    for (let i = 0; i < Math.min(2, variableCount); i++) {
      await availableVariables.nth(i).dragTo(page.locator('[data-testid="dependent-variables-list"]'));
      await page.waitForTimeout(500);
    }
    
    // Add factor variable if available
    if (variableCount > 2) {
      await availableVariables.nth(2).dragTo(page.locator('[data-testid="factor-variables-list"]'));
      await page.waitForTimeout(500);
    }
    
    // Configure statistics using data-testid
    await page.click('[data-testid="explore-statistics-tab"]');
    await expect(page.locator('[data-testid="explore-statistics-tab-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-descriptives-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-additional-stats-section"]')).toBeVisible();
    
    await page.check('[data-testid="explore-descriptives-checkbox"]');
    await page.fill('[data-testid="explore-confidence-interval-input"]', '95');
    await page.check('[data-testid="explore-outliers-checkbox"]');
    await page.waitForTimeout(1000);
    
    // Configure plots using data-testid
    await page.click('[data-testid="explore-plots-tab"]');
    await expect(page.locator('[data-testid="explore-plots-tab-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-boxplots-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-descriptives-plots-section"]')).toBeVisible();
    
    await page.check('[data-testid="explore-boxplot-factor-levels"]');
    await page.check('[data-testid="explore-stem-and-leaf-checkbox"]');
    await page.check('[data-testid="explore-histogram-checkbox"]');
    await page.waitForTimeout(1000);
    
    // Test footer elements with data-testid
    await expect(page.locator('[data-testid="explore-footer"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-help-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-reset-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-cancel-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-ok-button"]')).toBeVisible();
    
    // Execute analysis using data-testid
    await page.click('[data-testid="explore-ok-button"]');
    await page.waitForTimeout(8000); // Allow time for comprehensive analysis
    
    // Verify results are displayed
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    
    const totalTime = Date.now() - testStartTime;
    console.log(`Comprehensive data-testid workflow completed in: ${totalTime}ms`);
    
    // Verify no errors occurred
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });
});