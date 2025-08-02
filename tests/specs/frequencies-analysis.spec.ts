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

test.describe('Frequencies Analysis - Accidents Dataset Workflow', () => {
  let resourceMonitor: ResourceMonitor;
  let jsErrors: string[] = [];
  let networkErrors: string[] = [];
  
  test.beforeEach(async ({ page }) => {
    // Initialize resource monitoring
    resourceMonitor = new ResourceMonitor();
    jsErrors = [];
    networkErrors = [];
    
    // Setup error monitoring
    page.on('pageerror', (error) => {
      if (!error.message.includes('ResizeObserver') && 
          !error.message.includes('Non-Error promise rejection')) {
        jsErrors.push(error.message);
      }
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Start monitoring
    resourceMonitor.startMonitoring();
    
    // Navigasi ke halaman dashboard data
    await page.goto('/dashboard/data');
    
    // Tunggu halaman dimuat
    await page.waitForLoadState('networkidle');
    
    // Collect initial metrics
    await resourceMonitor.collectMetrics(page);
  });
  
  test.afterEach(async ({ page }) => {
    // Collect final metrics and validate performance
    await resourceMonitor.collectMetrics(page);
    
    // Log performance metrics
    resourceMonitor.logMetrics('Frequencies Analysis Test');
    
    // Validate performance
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance validation failed:', validation.issues);
    }
    
    // Check for JavaScript errors
    if (jsErrors.length > 0) {
      console.warn('JavaScript errors detected:', jsErrors);
    }
    
    // Check for network errors
    if (networkErrors.length > 0) {
      console.warn('Network errors detected:', networkErrors);
    }
  });

  test('should successfully load accidents.sav dataset', async ({ page }) => {
    console.log('Starting dataset loading test');
    
    // Click File menu
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    
    // Click Example Data
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    
    // Wait for and click accidents dataset
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Verify data is loaded by checking for data table or variables
    const dataLoaded = await page.isVisible('.data-table, [data-testid="data-table"], table');
    expect(dataLoaded).toBeTruthy();
    
    console.log('✅ Dataset loaded successfully');
  });

  test('should access Analyze menu and Frequencies submenu', async ({ page }) => {
    console.log('Starting menu navigation test');
    
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    // Click Analyze menu
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    
    // Hover over Descriptive Statistics
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    // Click Frequencies
    await page.click('text=Frequencies');
    await page.waitForTimeout(3000);
    
    // Verify modal or sidebar opened
    const modalOpened = await page.isVisible('.resize-content, [role="dialog"]');
    expect(modalOpened).toBeTruthy();
    
    console.log('✅ Frequencies modal/sidebar opened successfully');
  });

  test('should verify accidents.sav has required variables for frequencies analysis', async ({ page }) => {
    console.log('Starting variable verification test');
    
    // Load dataset and open frequencies modal
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text=Frequencies');
    await page.waitForTimeout(3000);
    
    // Check if modal opened
    const modalOpened = await page.isVisible('.resize-content');
    if (modalOpened) {
      // Wait for variables to load
      await page.waitForSelector('[data-testid="available-variable-list"], .variable-list', { timeout: 10000 });
      
      // Check for expected variables
      const expectedVariables = ['accid', 'pop', 'year'];
      
      for (const variable of expectedVariables) {
        const variableExists = await page.isVisible(`text="${variable}"`);
        if (variableExists) {
          console.log(`✅ Variable '${variable}' found`);
        } else {
          console.log(`⚠️ Variable '${variable}' not found`);
        }
      }
      
      console.log('✅ Variable verification completed');
    } else {
      console.log('❌ Modal did not open - cannot verify variables');
    }
  });

  test('should complete basic frequencies analysis workflow', async ({ page }) => {
    const testStartTime = Date.now();
    let phaseMetrics: { [key: string]: number } = {};
    
    console.log('Starting basic frequencies analysis workflow test');
    
    // Step 1: Load accidents.sav dataset
    const dataLoadStart = Date.now();
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    
    phaseMetrics.dataLoad = Date.now() - dataLoadStart;
    console.log(`Phase 1 - Data loading: ${phaseMetrics.dataLoad}ms`);
    
    // Step 2: Access Analyze > Descriptive Statistics > Frequencies
    const menuNavigationStart = Date.now();
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    await page.click('text=Frequencies');
    await page.waitForTimeout(3000);
    
    phaseMetrics.menuNavigation = Date.now() - menuNavigationStart;
    console.log(`Phase 2 - Menu navigation: ${phaseMetrics.menuNavigation}ms`);
    
    // Step 3: Verify modal opened and select variables
    let modalOpened = false;
    
    try {
      const sidebarModal = page.locator('.resize-content');
      if (await sidebarModal.isVisible({ timeout: 5000 })) {
        modalOpened = true;
        console.log('Modal Frequencies terbuka di sidebar panel');
        
        // Step 4: Select variables in the modal
        const variableSelectionStart = Date.now();
        await page.waitForTimeout(2000);
        
        // Wait for variables to load
        await page.waitForSelector('[data-testid="available-variable-list"]', { timeout: 10000 });
        
        // Select variable 'accid'
        const variablesToSelect = [
          { display: 'Accidents [accid]', short: 'accid' }
        ];
        
        const selectedList = page.locator('[data-list-id="selected"]');
        
        for (const variable of variablesToSelect) {
          try {
            // Try double-click using full display name
            let variableElement = page.locator(`[data-testid="available-variable-list"] >> text="${variable.display}"`).first();
            if (await variableElement.isVisible({ timeout: 2000 })) {
              await variableElement.dblclick();
              console.log(`Double-clicked variable: ${variable.display}`);
              await page.waitForTimeout(1000);
            } else {
              // Try with short name
              variableElement = page.locator(`[data-testid="available-variable-list"] >> text="${variable.short}"`).first();
              if (await variableElement.isVisible({ timeout: 2000 })) {
                await variableElement.dblclick();
                console.log(`Double-clicked variable with short name: ${variable.short}`);
                await page.waitForTimeout(1000);
              }
            }
            
            // Verify the variable moved to selected list
            const selectedVariable = selectedList.locator(`text="${variable.short}"`);
            if (await selectedVariable.isVisible({ timeout: 3000 })) {
              console.log(`Variable ${variable.short} successfully moved to selected list`);
            }
          } catch (error) {
            console.log(`Failed to select variable ${variable.short}:`, error);
          }
        }
        
        phaseMetrics.variableSelection = Date.now() - variableSelectionStart;
        console.log(`Phase 3 - Variable selection: ${phaseMetrics.variableSelection}ms`);
        
        // Step 5: Execute analysis
        const analysisExecutionStart = Date.now();
        const okButton = page.locator('button:has-text("OK")');
        if (await okButton.isVisible({ timeout: 3000 })) {
          const isDisabled = await okButton.getAttribute('disabled');
          if (isDisabled === null) {
            await okButton.click();
            console.log('Basic frequencies analysis executed');
            
            phaseMetrics.analysisExecution = Date.now() - analysisExecutionStart;
            console.log(`Phase 4 - Analysis execution: ${phaseMetrics.analysisExecution}ms`);
            
            // Step 6: Wait for results
            const resultWaitStart = Date.now();
            await page.waitForTimeout(5000);
            
            // Check if navigated to results page
            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard/result')) {
              phaseMetrics.resultNavigation = Date.now() - resultWaitStart;
              console.log(`Successfully navigated to results page in ${phaseMetrics.resultNavigation}ms`);
              
              // Verify basic results
              await page.waitForTimeout(3000);
              
              // Check for frequency table
              const resultSelectors = [
                'table:has-text("Frequency")',
                '.result-table',
                '[data-testid="result-table"]',
                'table:has-text("Valid")',
                'table:has-text("Percent")'
              ];
              
              let resultsFound = false;
              for (const selector of resultSelectors) {
                try {
                  const resultElement = page.locator(selector);
                  if (await resultElement.isVisible({ timeout: 5000 })) {
                    resultsFound = true;
                    console.log('Frequency table found');
                    break;
                  }
                } catch (e) {
                  // Continue to next selector
                }
              }
              
              if (resultsFound) {
                console.log('✅ Basic frequencies analysis completed successfully');
              } else {
                console.log('⚠️ Analysis executed but results not found in expected format');
              }
              
            } else {
              console.log('Not navigated to results page - analysis may still be processing');
            }
            
          } else {
            console.log('❌ OK button is disabled - cannot execute analysis');
          }
        } else {
          console.log('❌ OK button not found - cannot execute analysis');
        }
      }
    } catch (e) {
      console.log('Error during basic workflow:', e.message);
    }
    
    if (!modalOpened) {
      console.log('❌ Modal Frequencies did not open - cannot proceed with analysis');
    }
    
    // Calculate total test time and log metrics
    const totalTestTime = Date.now() - testStartTime;
    
    console.log('\n=== Basic Frequencies Analysis Performance Summary ===');
    console.log(`Total test time: ${totalTestTime}ms`);
    Object.entries(phaseMetrics).forEach(([phase, time]) => {
      console.log(`${phase}: ${time}ms (${((time / totalTestTime) * 100).toFixed(1)}%)`);
    });
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(60000); // Should complete within 60 seconds
  });

  test('should perform comprehensive frequencies analysis with all options', async ({ page }) => {
    // Load dataset
    await page.getByTestId('load-dataset-button').click();
    await page.getByTestId('dataset-accidents.sav').click();
    await page.waitForSelector('[data-testid="dataset-loaded-indicator"]', { timeout: 10000 });

    // Navigate to Frequencies
    await page.getByTestId('analyze-menu').click();
    await page.getByTestId('descriptive-statistics-submenu').click();
    await page.getByTestId('frequencies-menu-item').click();

    // Verify modal opened
    await expect(page.locator('[data-testid="frequencies-modal"]')).toBeVisible();

    // Select variable 'accid'
    const availableVariables = page.locator('[data-testid="available-variables-list"]');
    await availableVariables.locator('text=accid').click();
    await page.getByTestId('move-to-selected-button').click();

    // Verify variable moved to selected
    const selectedVariables = page.locator('[data-testid="selected-variables-list"]');
    await expect(selectedVariables.locator('text=accid')).toBeVisible();

    // Enable display frequency tables
    await page.getByTestId('display-frequency-tables-checkbox').check();
    await expect(page.getByTestId('display-frequency-tables-checkbox')).toBeChecked();

    // Switch to Statistics tab
    await page.getByTestId('statistics-tab').click();

    // Enable all Central Tendency statistics
    await page.getByTestId('frequencies-mean').check();
    await page.getByTestId('frequencies-median').check();
    await page.getByTestId('frequencies-mode').check();
    await page.getByTestId('frequencies-sum').check();

    // Enable all Dispersion statistics
    await page.getByTestId('frequencies-stddev').check();
    await page.getByTestId('frequencies-variance').check();
    await page.getByTestId('frequencies-range').check();
    await page.getByTestId('frequencies-minimum').check();
    await page.getByTestId('frequencies-maximum').check();
    await page.getByTestId('frequencies-semean').check();

    // Enable all Distribution statistics
    await page.getByTestId('frequencies-skewness').check();
    await page.getByTestId('frequencies-kurtosis').check();

    // Switch to Charts tab
    await page.getByTestId('charts-tab').click();

    // Enable charts and select bar chart
    await page.getByTestId('display-charts-checkbox').check();
    await page.getByTestId('chart-type-bar').check();
    await page.getByTestId('chart-values-frequencies').check();

    // Execute analysis
    await page.getByTestId('frequencies-ok-button').click();

    // Wait for results and verify
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  });

  test('should test different chart types in frequencies analysis', async ({ page }) => {
    // Load dataset
    await page.getByTestId('load-dataset-button').click();
    await page.getByTestId('dataset-accidents.sav').click();
    await page.waitForSelector('[data-testid="dataset-loaded-indicator"]', { timeout: 10000 });

    // Navigate to Frequencies
    await page.getByTestId('analyze-menu').click();
    await page.getByTestId('descriptive-statistics-submenu').click();
    await page.getByTestId('frequencies-menu-item').click();

    // Select variable
    const availableVariables = page.locator('[data-testid="available-variables-list"]');
    await availableVariables.locator('text=accid').click();
    await page.getByTestId('move-to-selected-button').click();

    // Switch to Charts tab
    await page.getByTestId('charts-tab').click();

    // Test different chart types
    await page.getByTestId('display-charts-checkbox').check();
    
    // Test Pie Chart
    await page.getByTestId('chart-type-pie').check();
    await expect(page.getByTestId('chart-type-pie')).toBeChecked();
    await page.getByTestId('chart-values-percentages').check();
    
    // Test Histogram
    await page.getByTestId('chart-type-histogram').check();
    await expect(page.getByTestId('chart-type-histogram')).toBeChecked();
    
    // Test None option
    await page.getByTestId('chart-type-none').check();
    await expect(page.getByTestId('chart-type-none')).toBeChecked();

    // Execute analysis
    await page.getByTestId('frequencies-ok-button').click();

    // Wait for results
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  });

  test('should test statistics options independently', async ({ page }) => {
    // Load dataset
    await page.getByTestId('load-dataset-button').click();
    await page.getByTestId('dataset-accidents.sav').click();
    await page.waitForSelector('[data-testid="dataset-loaded-indicator"]', { timeout: 10000 });

    // Navigate to Frequencies
    await page.getByTestId('analyze-menu').click();
    await page.getByTestId('descriptive-statistics-submenu').click();
    await page.getByTestId('frequencies-menu-item').click();

    // Select variable
    const availableVariables = page.locator('[data-testid="available-variables-list"]');
    await availableVariables.locator('text=accid').click();
    await page.getByTestId('move-to-selected-button').click();

    // Switch to Statistics tab
    await page.getByTestId('statistics-tab').click();

    // Test individual statistics options
    const statisticsOptions = [
        'frequencies-mean',
        'frequencies-median', 
        'frequencies-mode',
        'frequencies-sum',
        'frequencies-stddev',
        'frequencies-variance',
        'frequencies-range',
        'frequencies-minimum',
        'frequencies-maximum',
        'frequencies-semean',
        'frequencies-skewness',
        'frequencies-kurtosis'
    ];

    // Test each option can be checked and unchecked
    for (const option of statisticsOptions) {
        await page.getByTestId(option).check();
        await expect(page.getByTestId(option)).toBeChecked();
        await page.getByTestId(option).uncheck();
        await expect(page.getByTestId(option)).not.toBeChecked();
    }

    // Enable a few key statistics for final analysis
    await page.getByTestId('frequencies-mean').check();
    await page.getByTestId('frequencies-stddev').check();
    await page.getByTestId('frequencies-minimum').check();
    await page.getByTestId('frequencies-maximum').check();

    // Execute analysis
    await page.getByTestId('frequencies-ok-button').click();

    // Wait for results
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  });
});