# Aturan Terstandarisasi Testing untuk Statify

Dokumen ini menetapkan standar testing yang tepat, minimal tapi optimal untuk aplikasi Statify berdasarkan implementasi yang sudah ada.

## 1. Struktur File Testing

### Konvensi Penamaan
```
{feature-name}-analysis.spec.ts
```

**Contoh:**
- `descriptive-analysis.spec.ts`
- `frequencies-analysis.spec.ts`
- `correlation-analysis.spec.ts`
- `regression-analysis.spec.ts`

### Template Struktur File (Berdasarkan Implementasi Aktual)
```typescript
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
  private metrics: PerformanceMetrics = {
    // Default values...
  };

  startMonitoring() {
    this.startTime = Date.now();
  }

  async collectMetrics(page: any): Promise<PerformanceMetrics> {
    // Implementation...
  }

  logMetrics(testName: string) {
    // Implementation...
  }

  validatePerformance(): { passed: boolean; issues: string[] } {
    // Implementation...
  }

  private getBrowserSpecificThresholds() {
    // Implementation...
  }
}

test.describe('{Feature Name} - {Dataset} Workflow', () => {
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
  
  // Tests here
});
```

## 2. Standar Data-TestId

### Konvensi Penamaan Data-TestId (Berdasarkan Implementasi Aktual)
```
{component-type}-{action/element}-{descriptor}
```

**Contoh dari Implementasi Aktual:**
- `variables-tab-trigger`
- `statistics-tab-trigger`
- `charts-tab-trigger`
- `frequencies-ok-button`
- `display-frequency-tables-checkbox`
- `frequencies-mean`
- `frequencies-median`
- `frequencies-mode`
- `frequencies-sum`
- `frequencies-std-deviation`
- `frequencies-variance`
- `frequencies-range`
- `frequencies-minimum`
- `frequencies-maximum`
- `frequencies-se-mean`
- `frequencies-skewness`
- `frequencies-kurtosis`
- `display-charts-checkbox`
- `chart-type-none`
- `chart-type-bar`
- `chart-type-pie`
- `chart-type-histogram`
- `chart-values-frequencies`
- `chart-values-percentages`

### Kategori Data-TestId

#### Navigation & Menu (Berdasarkan Implementasi)
- Menggunakan text selector: `button:has-text("File")`
- Menggunakan text selector: `text=Example Data`
- Menggunakan text selector: `button:has-text("accidents.sav")`
- Menggunakan text selector: `text=Analyze`
- Menggunakan text selector: `text=Descriptive Statistics`
- Menggunakan text selector: `text=Frequencies...`

#### Buttons & Actions
- `{feature-name}-ok-button` (contoh: `frequencies-ok-button`)
- `move-to-selected-button`
- `move-to-available-button`

#### Form Elements
- `{feature-name}-{option-name}` (contoh: `frequencies-mean`)
- `display-{feature}-checkbox` (contoh: `display-frequency-tables-checkbox`)
- `chart-type-{type}` (contoh: `chart-type-bar`)
- `chart-values-{type}` (contoh: `chart-values-frequencies`)

#### Lists & Containers
- `available-variables-list`
- `selected-variables-list`
- `analysis-results`
- `dataset-loaded-indicator`

#### Tabs
- `{tab-name}-tab-trigger` (contoh: `variables-tab-trigger`)

## 3. Standar Performance Monitoring

### Metrics yang Wajib Dimonitor
```typescript
interface PerformanceMetrics {
  // Core metrics
  loadTime: number;           // < 3000ms
  renderTime: number;         // < 2000ms
  interactionTime: number;    // < 5000ms
  
  // Memory metrics
  jsHeapSize: number;         // < 50MB (Chromium), < 60MB (Firefox), < 40MB (WebKit)
  domNodes: number;           // < 1500
  
  // Network metrics
  networkRequests: number;
  networkLatency: number;     // < 1000ms
  
  // Error metrics
  errorRate: number;          // < 5%
  
  // Browser-specific
  browserName: string;
  browserVersion: string;
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
}
```

### Browser-Specific Thresholds
| Metric | Chromium | Firefox | WebKit |
|--------|----------|---------|--------|
| Load Time | 3000ms | 3000ms | 3500ms |
| Render Time | 2000ms | 2500ms | 2000ms |
| JS Heap Size | 50MB | 60MB | 40MB |
| DOM Nodes | 1500 | 1500 | 1500 |
| Network Latency | 1000ms | 1000ms | 1000ms |
| Error Rate | 5% | 5% | 5% |

## 4. Standar Test Cases

### Minimal Test Coverage
Setiap feature harus memiliki minimal 4 test cases:

1. **Basic Functionality Test**
   - Load dataset
   - Navigate to feature
   - Execute basic operation
   - Verify results

2. **Comprehensive Options Test**
   - Enable all available options
   - Test all combinations
   - Verify complex scenarios

3. **Individual Components Test**
   - Test each UI component independently
   - Verify state changes
   - Test validation rules

4. **Performance & Error Handling Test**
   - Monitor resource usage
   - Test error scenarios
   - Validate performance thresholds

### Template Test Case (Berdasarkan Implementasi Aktual)
```typescript
test('should {action description}', async ({ page }) => {
  const testStartTime = Date.now();
  
  // Collect baseline metrics
  const baselineMetrics = await resourceMonitor.collectMetrics(page);
  console.log('Baseline metrics collected');
  
  // 1. Setup (load dataset) - Menggunakan implementasi aktual
  const fileClickStart = Date.now();
  await page.click('button:has-text("File")');
  await page.waitForTimeout(1000);
  const fileClickTime = Date.now() - fileClickStart;
  console.log(`File menu click time: ${fileClickTime}ms`);
  
  await page.click('text=Example Data');
  await page.waitForTimeout(2000);
  
  await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
  await page.click('button:has-text("accidents.sav")');
  
  const dataLoadStart = Date.now();
  await page.waitForTimeout(5000);
  const dataLoadTime = Date.now() - dataLoadStart;
  console.log(`Data load wait time: ${dataLoadTime}ms`);
  
  // 2. Navigate to feature - Menggunakan implementasi aktual
  await page.click('text=Analyze');
  await page.waitForTimeout(1000);
  
  await page.click('text=Descriptive Statistics');
  await page.waitForTimeout(1000);
  
  await page.click('text={Feature Name}...');
  await page.waitForTimeout(2000);
  
  // 3. Configure options - Contoh untuk Frequencies
  // Tab Variables
  await page.getByTestId('variables-tab-trigger').click();
  // Select variables and configure options
  
  // Tab Statistics
  await page.getByTestId('statistics-tab-trigger').click();
  await page.getByTestId('frequencies-mean').check();
  await page.getByTestId('frequencies-median').check();
  
  // Tab Charts
  await page.getByTestId('charts-tab-trigger').click();
  await page.getByTestId('display-charts-checkbox').check();
  await page.getByTestId('chart-type-bar').check();
  
  // 4. Execute and verify
  await page.getByTestId('{feature}-ok-button').click();
  await page.waitForTimeout(3000);
  
  // Verify results (implementasi spesifik per feature)
  // await expect(page.locator('selector-for-results')).toBeVisible();
  
  // 5. Performance validation
  const totalTestTime = Date.now() - testStartTime;
  console.log(`Total test time: ${totalTestTime}ms`);
  
  // Assert no errors
  expect(jsErrors.length).toBe(0);
  expect(networkErrors.length).toBe(0);
});
```

## 5. Standar Error Handling

### Error Monitoring Setup
```typescript
test.beforeEach(async ({ page }) => {
  jsErrors = [];
  networkErrors = [];
  
  // Monitor JavaScript errors (filter out known non-critical errors)
  page.on('pageerror', (error) => {
    if (!error.message.includes('ResizeObserver') && 
        !error.message.includes('Non-Error promise rejection')) {
      jsErrors.push(error.message);
    }
  });
  
  // Monitor network failures
  page.on('requestfailed', (request) => {
    networkErrors.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
  });
});
```

### Error Validation
```typescript
test.afterEach(async ({ page }, testInfo) => {
  // Assert no critical errors
  expect(jsErrors.length).toBe(0);
  expect(networkErrors.length).toBe(0);
  
  // Log errors if any
  if (jsErrors.length > 0 || networkErrors.length > 0) {
    await testInfo.attach('error-logs', {
      body: JSON.stringify({ jsErrors, networkErrors }, null, 2),
      contentType: 'application/json'
    });
  }
});
```

## 6. Standar Cross-Browser Testing (Berdasarkan Implementasi Aktual)

### Sequential Execution
- Semua tes dijalankan secara sequential (`fullyParallel: false`)
- Workers: 1 untuk menghindari race condition
- Extended timeouts untuk browser compatibility
- Browser yang didukung: Chromium, Firefox, WebKit

### Browser Configuration (Berdasarkan CROSS_BROWSER_TESTING.md)
```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: false,
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
  ],
});
```

### Running Tests (Berdasarkan Script PowerShell)
```bash
# Menggunakan script PowerShell yang sudah ada
.\tests\run-cross-browser-tests.ps1

# Manual commands
npx playwright test descriptive-analysis.spec.ts --reporter=line
npx playwright test {feature}-analysis.spec.ts --reporter=line

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# With UI
npx playwright test --ui

# Headed mode
npx playwright test --headed

# Show report
npx playwright show-report
```

## 7. Standar Timeout & Waiting (Berdasarkan Implementasi Aktual)

### Timeout Guidelines
- **Page Load**: `await page.waitForLoadState('networkidle')`
- **File Menu Click**: 1000ms
- **Example Data Click**: 2000ms
- **Dataset Selection**: 10000ms (dengan `waitForSelector`)
- **Dataset Load**: 5000ms
- **Menu Navigation**: 1000ms per step
- **Modal Operations**: 2000ms
- **Analysis Execution**: 3000ms

### Waiting Strategies (Berdasarkan Implementasi Aktual)
```typescript
// Wait for network idle (digunakan di beforeEach)
await page.waitForLoadState('networkidle');

// Wait for specific element dengan timeout
await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });

// Wait with fixed timeout (digunakan untuk stabilitas)
await page.waitForTimeout(1000); // File menu
await page.waitForTimeout(2000); // Example data
await page.waitForTimeout(5000); // Dataset load
await page.waitForTimeout(3000); // Analysis execution

// Kombinasi click dan wait
await page.click('text=Analyze');
await page.waitForTimeout(1000);
```

## 8. Standar Assertions

### Visibility Assertions
```typescript
// Element visible
await expect(page.locator('[data-testid="element"]')).toBeVisible();

// Element not visible
await expect(page.locator('[data-testid="element"]')).not.toBeVisible();

// Element checked
await expect(page.getByTestId('checkbox')).toBeChecked();
```

### Content Assertions
```typescript
// Text content
await expect(page.locator('h1')).toHaveText('Expected Text');

// Attribute value
await expect(page.locator('input')).toHaveValue('expected-value');

// URL
await expect(page).toHaveURL('/expected-path');
```

### Performance Assertions
```typescript
// Time-based
expect(totalTestTime).toBeLessThan(30000);

// Error-based
expect(jsErrors.length).toBe(0);
expect(networkErrors.length).toBe(0);

// Resource-based
expect(metrics.jsHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
expect(metrics.domNodes).toBeLessThan(1500);
```

## 9. Standar Dokumentasi Test

### Test Description Format
```typescript
test('should {action} {object} {condition}', async ({ page }) => {
  // Implementation
});
```

**Contoh:**
- `should load accidents.sav dataset successfully`
- `should perform comprehensive frequencies analysis with all options`
- `should test different chart types in frequencies analysis`
- `should validate performance thresholds across browsers`

### Test Group Description
```typescript
test.describe('{Feature Name} - {Dataset} Workflow', () => {
  // Tests
});
```

**Contoh:**
- `Descriptive Analysis - Accidents Dataset Workflow`
- `Frequencies Analysis - Comprehensive Testing`
- `Correlation Analysis - Performance Validation`

## 10. Checklist Kualitas Test (Berdasarkan Implementasi Aktual)

### ✅ Sebelum Commit
- [ ] File mengikuti konvensi penamaan: `{feature-name}-analysis.spec.ts`
- [ ] ResourceMonitor class terimplementasi dengan interface PerformanceMetrics
- [ ] Error monitoring setup dengan filter ResizeObserver dan Non-Error promise rejection
- [ ] beforeEach setup: goto('/dashboard/data'), waitForLoadState('networkidle')
- [ ] afterEach cleanup: collect metrics, validate performance, attach logs
- [ ] Data-testid mengikuti pola: `{feature-name}-{option-name}`
- [ ] Text selectors untuk navigation: `button:has-text()`, `text=`
- [ ] Timeout strategy sesuai implementasi aktual
- [ ] Performance thresholds browser-specific

### ✅ Struktur Test Case
- [ ] Test description: `should {action description}`
- [ ] Test group: `{Feature Name} - {Dataset} Workflow`
- [ ] Baseline metrics collection
- [ ] Time tracking untuk setiap step
- [ ] Console logging untuk debugging
- [ ] Error assertions: `expect(jsErrors.length).toBe(0)`
- [ ] Network error assertions: `expect(networkErrors.length).toBe(0)`

### ✅ Dataset Loading Pattern
- [ ] File menu click dengan timing
- [ ] Example Data click dengan 2000ms wait
- [ ] accidents.sav selection dengan waitForSelector timeout 10000ms
- [ ] Dataset load dengan 5000ms wait
- [ ] Navigation pattern: Analyze → Descriptive Statistics → Feature

### ✅ Feature Testing Pattern
- [ ] Tab navigation dengan data-testid: `{tab-name}-tab-trigger`
- [ ] Checkbox interactions: `{feature-name}-{option-name}`
- [ ] Radio button interactions: `chart-type-{type}`, `chart-values-{type}`
- [ ] OK button: `{feature-name}-ok-button`
- [ ] Results verification dengan appropriate timeout

### ✅ Cross-Browser Testing
- [ ] Script PowerShell `run-cross-browser-tests.ps1` berfungsi
- [ ] Sequential execution (`fullyParallel: false`, `workers: 1`)
- [ ] Browser-specific launch options configured
- [ ] Performance thresholds per browser validated
- [ ] HTML report generation working

### ✅ Sebelum Release
- [ ] Semua tes pass di 3 browser (Chromium, Firefox, WebKit)
- [ ] Performance metrics dalam threshold:
  - Chromium: Load Time < 3000ms, JS Heap < 50MB
  - Firefox: Load Time < 3000ms, JS Heap < 60MB
  - WebKit: Load Time < 3500ms, JS Heap < 40MB
- [ ] No critical JavaScript errors (filtered)
- [ ] No network request failures
- [ ] Test execution time reasonable
- [ ] Performance metrics attached to test results
- [ ] Error logs attached when present

### ✅ Documentation
- [ ] README.md updated dengan commands
- [ ] CROSS_BROWSER_TESTING.md updated dengan browser configs
- [ ] TESTING_STANDARDS.md followed
- [ ] PowerShell script documented

---

**Catatan**: Standar ini berdasarkan implementasi aktual di `descriptive-analysis.spec.ts` dan harus diikuti secara konsisten untuk memastikan kualitas testing yang optimal dan maintainable.