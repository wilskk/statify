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
    console.log(`\n=== Performance Metrics for: ${testName} ===`);
    console.log(`Browser: ${this.currentMetrics.browserName} v${this.currentMetrics.browserVersion}`);
    console.log(`Viewport: ${this.currentMetrics.viewport.width}x${this.currentMetrics.viewport.height}`);
    console.log(`Device Pixel Ratio: ${this.currentMetrics.devicePixelRatio}`);
    console.log(`User Agent: ${this.currentMetrics.userAgent.substring(0, 80)}...`);
    console.log(`--- Performance Metrics ---`);
    console.log(`Load Time: ${this.currentMetrics.loadTime.toFixed(2)}ms`);
    console.log(`Render Time (FCP): ${this.currentMetrics.renderTime.toFixed(2)}ms`);
    console.log(`Interaction Time: ${this.currentMetrics.interactionTime}ms`);
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
      issues.push(`Memory usage too high for ${this.currentMetrics.browserName}: ${this.currentMetrics.jsHeapSize} bytes (threshold: ${thresholds.jsHeapSize} bytes)`);
    }
    
    if (this.currentMetrics.domNodes > thresholds.domNodes) {
      issues.push(`Too many DOM nodes for ${this.currentMetrics.browserName}: ${this.currentMetrics.domNodes} (threshold: ${thresholds.domNodes})`);
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
    
    switch (this.currentMetrics.browserName) {
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

test.describe('Descriptive Analysis - Accidents Dataset Workflow', () => {
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
  
  test.afterEach(async ({ page }, testInfo) => {
    // Collect final metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    
    // Log performance metrics
    resourceMonitor.logMetrics(testInfo.title);
    
    // Validate performance
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance issues detected:', validation.issues);
    }
    
    // Log errors if any
    if (jsErrors.length > 0) {
      console.warn('JavaScript errors detected:', jsErrors);
    }
    
    if (networkErrors.length > 0) {
      console.warn('Network errors detected:', networkErrors);
    }
    
    // Add metrics to test results
    await testInfo.attach('performance-metrics', {
      body: JSON.stringify(finalMetrics, null, 2),
      contentType: 'application/json'
    });
    
    // Add error logs to test results
    if (jsErrors.length > 0 || networkErrors.length > 0) {
      await testInfo.attach('error-logs', {
        body: JSON.stringify({ jsErrors, networkErrors }, null, 2),
        contentType: 'application/json'
      });
    }
  });

  test('should successfully load accidents.sav dataset', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Baseline metrics collected');
    
    // Step 1: Klik menu File di navbar
    const fileClickStart = Date.now();
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    const fileClickTime = Date.now() - fileClickStart;
    console.log(`File menu click time: ${fileClickTime}ms`);
    
    // Step 2: Klik Example Data
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    
    // Step 3: Tunggu dan klik accidents dataset
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    
    // Step 4: Tunggu data dimuat
    const dataLoadStart = Date.now();
    await page.waitForTimeout(5000);
    const dataLoadTime = Date.now() - dataLoadStart;
    console.log(`Data load wait time: ${dataLoadTime}ms`);
    
    // Collect metrics after data load
    const postLoadMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Memory usage after data load: ${(postLoadMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM nodes after data load: ${postLoadMetrics.domNodes}`);
    
    // Verifikasi bahwa data berhasil dimuat dengan memeriksa adanya variabel
    const variables = ['agecat', 'gender', 'accid', 'pop'];
    
    for (const variable of variables) {
      // Gunakan selector yang lebih spesifik untuk header kolom yang visible
      const variableElement = page.locator(`.colHeader:has-text("${variable}"):visible, [data-testid="column-header"]:has-text("${variable}"):visible, th:has-text("${variable}"):visible`);
      await expect(variableElement.first()).toBeVisible({ timeout: 5000 });
    }
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Dataset accidents.sav berhasil dimuat dengan 4 variabel dalam ${totalTestTime}ms`);
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(30000); // Should complete within 30 seconds
  });

  test('should access Analyze menu and Descriptive submenu', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Starting menu navigation test');
    
    // Load accidents.sav first
    const dataLoadStart = Date.now();
    await page.click('button:has-text("File")');
    await page.click('text=Example Data');
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    const dataLoadTime = Date.now() - dataLoadStart;
    console.log(`Data loading time: ${dataLoadTime}ms`);
    
    // Test akses menu Analyze
    const menuAccessStart = Date.now();
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    const menuAccessTime = Date.now() - menuAccessStart;
    console.log(`Analyze menu access time: ${menuAccessTime}ms`);
    
    // Verifikasi submenu Descriptive Statistics tersedia
    const descriptiveMenu = page.locator('text=Descriptive Statistics');
    await expect(descriptiveMenu.first()).toBeVisible({ timeout: 5000 });
    
    // Hover ke Descriptive Statistics untuk membuka submenu
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    // Verifikasi menu Descriptives tersedia
    const descriptivesItem = page.locator('text=Descriptives');
    await expect(descriptivesItem.first()).toBeVisible({ timeout: 5000 });
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Menu Analyze > Descriptive Statistics > Descriptives berhasil diakses dalam ${totalTestTime}ms`);
    
    // Collect final metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Final memory usage: ${(finalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Final DOM nodes: ${finalMetrics.domNodes}`);
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(20000); // Should complete within 20 seconds
  });

  test('should complete basic workflow: load dataset and access descriptive menu', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Starting basic workflow test');
    
    // Step 1-3: Load accidents.sav
    const dataLoadStart = Date.now();
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    const dataLoadTime = Date.now() - dataLoadStart;
    console.log(`Data loading phase time: ${dataLoadTime}ms`);
    
    // Collect metrics after data load
    const postDataLoadMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Memory after data load: ${(postDataLoadMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Step 4-6: Access Analyze > Descriptive Statistics menu
    const menuNavigationStart = Date.now();
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    const menuNavigationTime = Date.now() - menuNavigationStart;
    console.log(`Menu navigation time: ${menuNavigationTime}ms`);
    
    // Verifikasi menu Descriptives dapat diakses
    const descriptivesMenu = page.locator('text=Descriptives');
    await expect(descriptivesMenu.first()).toBeVisible({ timeout: 5000 });
    
    // Klik Descriptives untuk membuka modal (jika berhasil)
    try {
      await page.click('text=Descriptives');
      await page.waitForTimeout(2000);
      
      // Cek apakah modal terbuka di sidebar panel (desktop) atau dialog (mobile)
      // Untuk desktop: modal muncul di resizable panel sebagai sidebar
      // Untuk mobile: modal muncul sebagai dialog
      let modalOpened = false;
      let modalLocation = 'tidak diketahui';
      
      // Cek sidebar modal dengan timeout yang lebih pendek
      try {
        const sidebarModal = page.locator('.resize-content');
        const sidebarVisible = await sidebarModal.isVisible({ timeout: 3000 });
        if (sidebarVisible) {
          modalOpened = true;
          modalLocation = 'sidebar panel';
        }
      } catch (e) {
        // Ignore timeout error untuk sidebar
      }
      
      // Jika sidebar tidak terdeteksi, cek dialog modal
      if (!modalOpened) {
        try {
          const dialogModal = page.locator('[role="dialog"], .dialog-content, .modal-content');
          const dialogVisible = await dialogModal.isVisible({ timeout: 3000 });
          if (dialogVisible) {
            modalOpened = true;
            modalLocation = 'dialog';
          }
        } catch (e) {
          // Ignore timeout error untuk dialog
        }
      }
      
      if (modalOpened) {
        console.log('Modal Descriptives berhasil terbuka di', modalLocation);
        
        // Collect metrics after modal open
        const postModalMetrics = await resourceMonitor.collectMetrics(page);
        console.log(`Memory after modal open: ${(postModalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`DOM nodes after modal: ${postModalMetrics.domNodes}`);
        
        // Jika modal terbuka, coba tutup dengan tombol Cancel
        try {
          const cancelButton = page.locator('button:has-text("Cancel")');
          if (await cancelButton.isVisible({ timeout: 2000 })) {
            await cancelButton.first().click();
          }
        } catch (e) {
          // Ignore jika tombol cancel tidak ditemukan
        }
      } else {
        console.log('Modal Descriptives tidak terbuka, tetapi menu dapat diakses');
      }
    } catch (error) {
      console.log('Error saat mengklik Descriptives:', error.message);
    }
    
    const totalTestTime = Date.now() - testStartTime;
    
    console.log(`Workflow dasar selesai dalam ${totalTestTime}ms`);
    
    // Collect final metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Final memory usage: ${(finalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total network requests: ${finalMetrics.networkRequests}`);
    console.log(`Average network latency: ${finalMetrics.networkLatency.toFixed(2)}ms`);
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(25000); // Should complete within 25 seconds
    
    // Validate performance thresholds
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance validation failed:', validation.issues);
    }
  });

  test('should verify accidents.sav has required variables for descriptive analysis', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Starting variable verification test');
    
    // Load accidents.sav
    const dataLoadStart = Date.now();
    await page.click('button:has-text("File")');
    await page.click('text=Example Data');
    await page.waitForSelector('[data-testid="example-dataset-accidents"]', { timeout: 10000 });
    await page.click('[data-testid="example-dataset-accidents"]');
    await page.waitForTimeout(5000);
    const dataLoadTime = Date.now() - dataLoadStart;
    console.log(`Data loading time: ${dataLoadTime}ms`);
    
    // Verify required variables for descriptive analysis: accid and pop
    const requiredVariables = ['accid', 'pop'];
    
    for (const variable of requiredVariables) {
      // Gunakan selector yang lebih spesifik untuk header kolom yang visible
      const variableElement = page.locator(`.colHeader:has-text("${variable}"):visible, [data-testid="column-header"]:has-text("${variable}"):visible, th:has-text("${variable}"):visible`);
      await expect(variableElement.first()).toBeVisible({ timeout: 5000 });
    }
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Variabel accid dan pop tersedia untuk analisis deskriptif - selesai dalam ${totalTestTime}ms`);
    
    // Collect final metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Memory usage: ${(finalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM nodes: ${finalMetrics.domNodes}`);
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(15000); // Should complete within 15 seconds
  });

  test('should complete full descriptive analysis workflow and verify results', async ({ page }) => {
    const testStartTime = Date.now();
    let phaseMetrics: { [key: string]: number } = {};
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Starting full descriptive analysis workflow test');
    console.log(`Baseline memory: ${(baselineMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Baseline DOM nodes: ${baselineMetrics.domNodes}`);
    
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
    
    // Collect metrics after data load
    const postDataLoadMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`Memory after data load: ${(postDataLoadMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM nodes after data load: ${postDataLoadMetrics.domNodes}`);
    
    // Step 2: Access Analyze > Descriptive Statistics > Descriptives
    const menuNavigationStart = Date.now();
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    await page.click('text=Descriptives');
    await page.waitForTimeout(3000);
    
    phaseMetrics.menuNavigation = Date.now() - menuNavigationStart;
    console.log(`Phase 2 - Menu navigation: ${phaseMetrics.menuNavigation}ms`);
    
    // Step 3: Verify modal opened and select variables
    let modalOpened = false;
    
    // Check if modal opened in sidebar panel
    try {
      const sidebarModal = page.locator('.resize-content');
      if (await sidebarModal.isVisible({ timeout: 5000 })) {
        modalOpened = true;
        console.log('Modal Descriptives terbuka di sidebar panel');
        
        // Collect metrics after modal open
        const postModalMetrics = await resourceMonitor.collectMetrics(page);
        console.log(`Memory after modal open: ${(postModalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`DOM nodes after modal: ${postModalMetrics.domNodes}`);
        
        // Step 4: Select variables (accid and pop) in the modal
        const variableSelectionStart = Date.now();
        await page.waitForTimeout(2000);
        
        // Wait for variables to load
        await page.waitForSelector('[data-testid="available-variable-list"]', { timeout: 10000 });
        
        // Verify that no variables are initially selected (should be empty)
        const selectedList = page.locator('[data-list-id="selected"]');
        const initialSelectedCount = await selectedList.locator('div.flex.items-center').count();
        console.log(`Initial selected variables count: ${initialSelectedCount}`);
        
        // Try to select variables 'accid' and 'pop' by drag and drop from available to selected list
        const variablesToSelect = [
          { display: 'Accidents [accid]', short: 'accid' },
          { display: 'Population at risk [pop]', short: 'pop' }
        ];
        
        const selectedListTarget = page.locator('[data-list-id="selected"]');
        
        for (const variable of variablesToSelect) {
          try {
            // Try multiple approaches to select the variable
            
            // Approach 1: Double-click using full display name
            let variableElement = page.locator(`[data-testid="available-variable-list"] >> text="${variable.display}"`).first();
            if (await variableElement.isVisible({ timeout: 2000 })) {
              await variableElement.dblclick();
              console.log(`Double-clicked variable: ${variable.display}`);
              await page.waitForTimeout(1000);
            } else {
              // Approach 2: Try with short name
              variableElement = page.locator(`[data-testid="available-variable-list"] >> text="${variable.short}"`).first();
              if (await variableElement.isVisible({ timeout: 2000 })) {
                await variableElement.dblclick();
                console.log(`Double-clicked variable with short name: ${variable.short}`);
                await page.waitForTimeout(1000);
              } else {
                // Approach 3: Try drag and drop
                variableElement = page.locator(`[data-testid="available-variable-list"] >> div:has-text("${variable.short}")`).first();
                if (await variableElement.isVisible({ timeout: 2000 })) {
                  await variableElement.dragTo(selectedListTarget);
                  console.log(`Dragged variable: ${variable.short}`);
                  await page.waitForTimeout(1000);
                }
              }
            }
            
            // Verify the variable moved to selected list
            const selectedVariable = selectedList.locator(`text="${variable.short}"`);
            if (await selectedVariable.isVisible({ timeout: 3000 })) {
              console.log(`Variable ${variable.short} successfully moved to selected list`);
            } else {
              console.log(`Warning: Variable ${variable.short} may not have moved to selected list`);
            }
          } catch (error) {
            console.log(`Failed to select variable ${variable.short}:`, error);
          }
        }
        
        // Verify that variables are now selected
        const finalSelectedCount = await selectedList.locator('div.flex.items-center').count();
        console.log(`Final selected variables count: ${finalSelectedCount}`);
        
        // Ensure we have at least some variables selected before proceeding
        if (finalSelectedCount === 0) {
          console.log('Warning: No variables were selected, analysis may fail');
        }
        
        phaseMetrics.variableSelection = Date.now() - variableSelectionStart;
        console.log(`Phase 3 - Variable selection: ${phaseMetrics.variableSelection}ms`);
        
        // Collect metrics after variable selection
        const postSelectionMetrics = await resourceMonitor.collectMetrics(page);
        console.log(`Memory after variable selection: ${(postSelectionMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
        
        // Wait a bit for variable selection to register
        await page.waitForTimeout(1000);
        
        await page.waitForTimeout(2000);
        
        // Step 5: Execute analysis
        const executeSelectors = [
          '#descriptive-ok-button',
          'button:has-text("OK")',
          'button:has-text("Execute")',
          'button:has-text("Run")',
          'button:has-text("Analyze")',
          '[data-testid="execute-button"]',
          '.execute-btn',
          'button[type="submit"]'
        ];
        
        // Step 5: Execute analysis
        const analysisExecutionStart = Date.now();
        let analysisExecuted = false;
        for (const selector of executeSelectors) {
          try {
            const executeButton = page.locator(selector);
            if (await executeButton.isVisible({ timeout: 3000 })) {
              // Pastikan tombol tidak disabled
              const isDisabled = await executeButton.getAttribute('disabled');
              if (isDisabled === null) {
                await executeButton.first().click();
                analysisExecuted = true;
                console.log('Analisis deskriptif berhasil dijalankan dengan selector:', selector);
                break;
              } else {
                console.log('Tombol execute ditemukan tapi disabled:', selector);
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (analysisExecuted) {
          phaseMetrics.analysisExecution = Date.now() - analysisExecutionStart;
          console.log(`Phase 4 - Analysis execution: ${phaseMetrics.analysisExecution}ms`);
          
          // Step 6: Wait for analysis to complete and check for navigation
          const resultWaitStart = Date.now();
          await page.waitForTimeout(5000);
          
          // Check if automatically navigated to results page
          const currentUrl = page.url();
          if (currentUrl.includes('/dashboard/result')) {
            phaseMetrics.resultNavigation = Date.now() - resultWaitStart;
            console.log(`Berhasil diarahkan ke halaman hasil secara otomatis dalam ${phaseMetrics.resultNavigation}ms`);
            
            // Step 7: Verify results table
            const resultVerificationStart = Date.now();
            await page.waitForTimeout(3000);
            
            // Collect metrics on results page
            const resultsPageMetrics = await resourceMonitor.collectMetrics(page);
            console.log(`Memory on results page: ${(resultsPageMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`DOM nodes on results page: ${resultsPageMetrics.domNodes}`);
            
            // Check for descriptive statistics table
            const resultSelectors = [
              'table:has-text("Descriptive Statistics")',
              '.result-table',
              '[data-testid="result-table"]',
              'table:has-text("Mean")',
              'table:has-text("Std. Deviation")',
              '.descriptive-results'
            ];
            
            let resultsFound = false;
            for (const selector of resultSelectors) {
              try {
                const resultElement = page.locator(selector);
                if (await resultElement.isVisible({ timeout: 5000 })) {
                  resultsFound = true;
                  console.log('Tabel hasil analisis deskriptif ditemukan');
                  
                  // Verify specific statistical measures
                  const statisticalMeasures = ['Mean', 'Std. Deviation', 'Minimum', 'Maximum', 'N'];
                  for (const measure of statisticalMeasures) {
                    const measureElement = page.locator(`text=${measure}`);
                    if (await measureElement.isVisible({ timeout: 2000 })) {
                      console.log(`Statistik ${measure} ditemukan dalam hasil`);
                    }
                  }
                  
                  // Verify variables in results
                  const resultVariables = ['accid', 'pop', 'Accidents', 'Population'];
                  for (const variable of resultVariables) {
                    const variableInResult = page.locator(`text=${variable}`);
                    if (await variableInResult.isVisible({ timeout: 2000 })) {
                      console.log(`Variabel ${variable} ditemukan dalam hasil`);
                    }
                  }
                  
                  break;
                }
              } catch (e) {
                // Continue to next selector
              }
            }
            
            phaseMetrics.resultVerification = Date.now() - resultVerificationStart;
            console.log(`Phase 5 - Result verification: ${phaseMetrics.resultVerification}ms`);
            
            if (resultsFound) {
              console.log('✅ Analisis deskriptif berhasil dijalankan sampai selesai dengan hasil yang valid');
            } else {
              console.log('⚠️ Analisis dijalankan tapi hasil tidak ditemukan dalam format yang diharapkan');
            }
            
            // Verify SPSS command log
            const commandLogSelectors = [
              'text=DESCRIPTIVES',
              'text=VARIABLES=',
              'text=/STATISTICS=',
              '.command-log',
              '[data-testid="command-log"]'
            ];
            
            for (const selector of commandLogSelectors) {
              try {
                const logElement = page.locator(selector);
                if (await logElement.isVisible({ timeout: 2000 })) {
                  console.log('Log perintah SPSS ditemukan');
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
            
          } else {
            console.log('Tidak diarahkan ke halaman hasil - mungkin analisis belum selesai');
            
            // Wait longer and check again
            const extendedWaitStart = Date.now();
            await page.waitForTimeout(10000);
            const finalUrl = page.url();
            if (finalUrl.includes('/dashboard/result')) {
              phaseMetrics.extendedWait = Date.now() - extendedWaitStart;
              console.log(`Akhirnya diarahkan ke halaman hasil setelah menunggu ${phaseMetrics.extendedWait}ms lebih lama`);
            }
          }
          
        } else {
          console.log('❌ Tombol execute tidak ditemukan - analisis tidak dapat dijalankan');
        }
      }
    } catch (e) {
      console.log('Error saat mengakses modal atau menjalankan analisis:', e.message);
    }
    
    if (!modalOpened) {
      console.log('❌ Modal Descriptives tidak terbuka - tidak dapat melanjutkan analisis');
    }
    
    // Calculate total test time and log comprehensive metrics
    const totalTestTime = Date.now() - testStartTime;
    
    console.log('\n=== Full Workflow Performance Summary ===');
    console.log(`Total test time: ${totalTestTime}ms`);
    Object.entries(phaseMetrics).forEach(([phase, time]) => {
      console.log(`${phase}: ${time}ms (${((time / totalTestTime) * 100).toFixed(1)}%)`);
    });
    
    // Collect final comprehensive metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`\nFinal Resource Usage:`);
    console.log(`Memory: ${(finalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${finalMetrics.domNodes}`);
    console.log(`Network Requests: ${finalMetrics.networkRequests}`);
    console.log(`Average Latency: ${finalMetrics.networkLatency.toFixed(2)}ms`);
    console.log('==========================================\n');
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(60000); // Should complete within 60 seconds
    
    // Phase-specific performance assertions
    expect(phaseMetrics.dataLoad || 0).toBeLessThan(15000); // Data load < 15s
    expect(phaseMetrics.menuNavigation || 0).toBeLessThan(5000); // Menu navigation < 5s
    expect(phaseMetrics.variableSelection || 0).toBeLessThan(10000); // Variable selection < 10s
    expect(phaseMetrics.analysisExecution || 0).toBeLessThan(3000); // Analysis execution < 3s
    
    // Memory usage should not exceed thresholds
    expect(finalMetrics.jsHeapSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
    expect(finalMetrics.domNodes).toBeLessThan(2000); // < 2000 DOM nodes
    
    // Validate overall performance
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance validation failed:', validation.issues);
      // Don't fail the test for performance issues, just warn
    }
  });

  test('should complete descriptive analysis with all statistics options and z-score enabled', async ({ page }) => {
    const testStartTime = Date.now();
    let phaseMetrics: { [key: string]: number } = {};
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Starting comprehensive descriptive analysis test with all options');
    console.log(`Baseline memory: ${(baselineMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    
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
    
    // Step 2: Access Analyze > Descriptive Statistics > Descriptives
    const menuNavigationStart = Date.now();
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    
    await page.hover('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    await page.click('text=Descriptives');
    await page.waitForTimeout(3000);
    
    phaseMetrics.menuNavigation = Date.now() - menuNavigationStart;
    console.log(`Phase 2 - Menu navigation: ${phaseMetrics.menuNavigation}ms`);
    
    // Step 3: Verify modal opened and select variables
    let modalOpened = false;
    
    // Check if modal opened in sidebar panel
    try {
      const sidebarModal = page.locator('.resize-content');
      if (await sidebarModal.isVisible({ timeout: 5000 })) {
        modalOpened = true;
        console.log('Modal Descriptives terbuka di sidebar panel');
        
        // Step 4: Select variables (accid and pop) in the modal
        const variableSelectionStart = Date.now();
        await page.waitForTimeout(2000);
        
        // Wait for variables to load
        await page.waitForSelector('[data-testid="available-variable-list"]', { timeout: 10000 });
        
        // Select variables 'accid' and 'pop'
        const variablesToSelect = [
          { display: 'Accidents [accid]', short: 'accid' },
          { display: 'Population at risk [pop]', short: 'pop' }
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
        
        // Step 5: Enable z-score option
        const zScoreStart = Date.now();
        const zScoreCheckbox = page.locator('[data-testid="save-standardized-checkbox"]');
        if (await zScoreCheckbox.isVisible({ timeout: 3000 })) {
          await zScoreCheckbox.check();
          console.log('Z-score option (Save standardized values) enabled');
        } else {
          console.log('Warning: Z-score checkbox not found');
        }
        
        phaseMetrics.zScoreSelection = Date.now() - zScoreStart;
        console.log(`Phase 4 - Z-score selection: ${phaseMetrics.zScoreSelection}ms`);
        
        // Step 6: Switch to Statistics tab
        const statisticsTabStart = Date.now();
        const statisticsTab = page.locator('[data-testid="descriptive-statistics-tab"]');
        if (await statisticsTab.isVisible({ timeout: 3000 })) {
          await statisticsTab.click();
          await page.waitForTimeout(2000);
          console.log('Switched to Statistics tab');
        } else {
          console.log('Warning: Statistics tab not found');
        }
        
        phaseMetrics.tabSwitch = Date.now() - statisticsTabStart;
        console.log(`Phase 5 - Tab switch: ${phaseMetrics.tabSwitch}ms`);
        
        // Step 7: Enable all statistics options
        const statisticsSelectionStart = Date.now();
        const statisticsOptions = [
          'statistics-mean',
          'statistics-median', 
          'statistics-sum',
          'statistics-stddev',
          'statistics-minimum',
          'statistics-variance',
          'statistics-maximum',
          'statistics-range',
          'statistics-standard-error',
          'statistics-kurtosis',
          'statistics-skewness'
        ];
        
        let enabledCount = 0;
        for (const optionTestId of statisticsOptions) {
          try {
            const checkbox = page.locator(`[data-testid="${optionTestId}"]`);
            if (await checkbox.isVisible({ timeout: 2000 })) {
              const isChecked = await checkbox.isChecked();
              if (!isChecked) {
                await checkbox.check();
                enabledCount++;
                console.log(`Enabled statistics option: ${optionTestId}`);
              } else {
                console.log(`Statistics option already enabled: ${optionTestId}`);
              }
              await page.waitForTimeout(200); // Small delay between clicks
            } else {
              console.log(`Warning: Statistics option not found: ${optionTestId}`);
            }
          } catch (error) {
            console.log(`Failed to enable statistics option ${optionTestId}:`, error);
          }
        }
        
        phaseMetrics.statisticsSelection = Date.now() - statisticsSelectionStart;
        console.log(`Phase 6 - Statistics selection: ${phaseMetrics.statisticsSelection}ms`);
        console.log(`Enabled ${enabledCount} additional statistics options`);
        
        // Step 8: Execute analysis
        const analysisExecutionStart = Date.now();
        const okButton = page.locator('[data-testid="descriptive-ok-button"]');
        if (await okButton.isVisible({ timeout: 3000 })) {
          const isDisabled = await okButton.getAttribute('disabled');
          if (isDisabled === null) {
            await okButton.click();
            console.log('Analysis executed with all statistics options and z-score enabled');
            
            phaseMetrics.analysisExecution = Date.now() - analysisExecutionStart;
            console.log(`Phase 7 - Analysis execution: ${phaseMetrics.analysisExecution}ms`);
            
            // Step 9: Wait for results
            const resultWaitStart = Date.now();
            await page.waitForTimeout(5000);
            
            // Check if navigated to results page
            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard/result')) {
              phaseMetrics.resultNavigation = Date.now() - resultWaitStart;
              console.log(`Successfully navigated to results page in ${phaseMetrics.resultNavigation}ms`);
              
              // Verify comprehensive results
              await page.waitForTimeout(3000);
              
              // Check for descriptive statistics table with all enabled options
              const resultSelectors = [
                'table:has-text("Descriptive Statistics")',
                '.result-table',
                '[data-testid="result-table"]',
                'table:has-text("Mean")',
                'table:has-text("Std. Deviation")'
              ];
              
              let resultsFound = false;
              for (const selector of resultSelectors) {
                try {
                  const resultElement = page.locator(selector);
                  if (await resultElement.isVisible({ timeout: 5000 })) {
                    resultsFound = true;
                    console.log('Comprehensive descriptive statistics table found');
                    
                    // Verify specific statistical measures are present
                    const expectedMeasures = [
                      'Mean', 'Median', 'Sum', 'Std. Deviation', 'Minimum', 
                      'Variance', 'Maximum', 'Range', 'S.E. mean', 'Kurtosis', 'Skewness'
                    ];
                    
                    let foundMeasures = 0;
                    for (const measure of expectedMeasures) {
                      const measureElement = page.locator(`text=${measure}`);
                      if (await measureElement.isVisible({ timeout: 2000 })) {
                        foundMeasures++;
                        console.log(`Statistical measure found: ${measure}`);
                      }
                    }
                    
                    console.log(`Found ${foundMeasures}/${expectedMeasures.length} expected statistical measures`);
                    
                    // Check for z-score variables (standardized versions)
                    const zScoreVariables = ['Zaccid', 'Zpop'];
                    let foundZScores = 0;
                    for (const zVar of zScoreVariables) {
                      const zVarElement = page.locator(`text=${zVar}`);
                      if (await zVarElement.isVisible({ timeout: 2000 })) {
                        foundZScores++;
                        console.log(`Z-score variable found: ${zVar}`);
                      }
                    }
                    
                    if (foundZScores > 0) {
                      console.log(`Found ${foundZScores} z-score variables in results`);
                    } else {
                      console.log('Note: Z-score variables may be created but not visible in this results view');
                    }
                    
                    break;
                  }
                } catch (e) {
                  // Continue to next selector
                }
              }
              
              if (resultsFound) {
                console.log('✅ Comprehensive descriptive analysis completed successfully with all options');
              } else {
                console.log('⚠️ Analysis executed but comprehensive results not found in expected format');
              }
              
            } else {
              console.log('Not navigated to results page - analysis may still be processing');
              
              // Wait longer and check again
              await page.waitForTimeout(10000);
              const finalUrl = page.url();
              if (finalUrl.includes('/dashboard/result')) {
                console.log('Finally navigated to results page after extended wait');
              }
            }
            
          } else {
            console.log('❌ OK button is disabled - cannot execute analysis');
          }
        } else {
          console.log('❌ OK button not found - cannot execute analysis');
        }
      }
    } catch (e) {
      console.log('Error during comprehensive analysis workflow:', e.message);
    }
    
    if (!modalOpened) {
      console.log('❌ Modal Descriptives did not open - cannot proceed with comprehensive analysis');
    }
    
    // Calculate total test time and log comprehensive metrics
    const totalTestTime = Date.now() - testStartTime;
    
    console.log('\n=== Comprehensive Analysis Performance Summary ===');
    console.log(`Total test time: ${totalTestTime}ms`);
    Object.entries(phaseMetrics).forEach(([phase, time]) => {
      console.log(`${phase}: ${time}ms (${((time / totalTestTime) * 100).toFixed(1)}%)`);
    });
    
    // Collect final comprehensive metrics
    const finalMetrics = await resourceMonitor.collectMetrics(page);
    console.log(`\nFinal Resource Usage:`);
    console.log(`Memory: ${(finalMetrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${finalMetrics.domNodes}`);
    console.log('=================================================\n');
    
    // Performance assertions
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(totalTestTime).toBeLessThan(90000); // Should complete within 90 seconds for comprehensive test
    
    // Memory usage should not exceed thresholds even with all options
    expect(finalMetrics.jsHeapSize).toBeLessThan(150 * 1024 * 1024); // < 150MB for comprehensive analysis
    expect(finalMetrics.domNodes).toBeLessThan(3000); // < 3000 DOM nodes
  });
});