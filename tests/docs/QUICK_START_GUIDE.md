# Quick Start Guide - Testing Standards untuk Statify

Panduan singkat untuk membuat test baru menggunakan standar yang telah ditetapkan.

## 🚀 Membuat Test Baru

### 1. Copy Template
```bash
cp tests/TEMPLATE.spec.ts tests/{feature-name}-analysis.spec.ts
```

### 2. Customize Template
Ganti placeholder berikut dalam file:
- `{Feature Name}` → nama fitur (contoh: "Frequencies")
- `{feature-name}` → nama fitur lowercase (contoh: "frequencies")
- `{Feature Name}...` → menu item (contoh: "Frequencies...")

### 3. Tambahkan Data-TestId ke UI
Pastikan komponen UI memiliki data-testid sesuai konvensi:
```typescript
// Tab triggers
data-testid="{tab-name}-tab-trigger"

// Feature options
data-testid="{feature-name}-{option-name}"

// Buttons
data-testid="{feature-name}-ok-button"

// Checkboxes
data-testid="display-{feature}-checkbox"

// Radio buttons
data-testid="chart-type-{type}"
data-testid="chart-values-{type}"
```

## 📋 Checklist Test Case

### ✅ Minimal Test Cases (4 wajib)
1. **Dataset Loading Test**
   - Load accidents.sav
   - Verify dataset loaded

2. **Basic Functionality Test**
   - Navigate to feature
   - Configure basic options
   - Execute analysis
   - Verify results

3. **Comprehensive Options Test**
   - Enable all available options
   - Test all combinations
   - Verify complex scenarios

4. **Performance & Error Test**
   - Monitor resource usage
   - Validate performance thresholds
   - Assert no errors

## 🔧 Pattern Implementasi

### Dataset Loading (Standard Pattern)
```typescript
// File menu
await page.click('button:has-text("File")');
await page.waitForTimeout(1000);

// Example Data
await page.click('text=Example Data');
await page.waitForTimeout(2000);

// Select dataset
await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
await page.click('button:has-text("accidents.sav")');
await page.waitForTimeout(5000);
```

### Feature Navigation (Standard Pattern)
```typescript
// Analyze menu
await page.click('text=Analyze');
await page.waitForTimeout(1000);

// Descriptive Statistics
await page.click('text=Descriptive Statistics');
await page.waitForTimeout(1000);

// Feature menu
await page.click('text={Feature Name}...');
await page.waitForTimeout(2000);
```

### Tab Navigation (Standard Pattern)
```typescript
// Variables tab
await page.getByTestId('variables-tab-trigger').click();
// Configure variables

// Statistics tab
await page.getByTestId('statistics-tab-trigger').click();
// Configure statistics options

// Charts tab
await page.getByTestId('charts-tab-trigger').click();
// Configure chart options
```

### Execution & Verification (Standard Pattern)
```typescript
// Execute analysis
await page.getByTestId('{feature-name}-ok-button').click();
await page.waitForTimeout(3000);

// Verify results (customize per feature)
// await expect(page.locator('selector-for-results')).toBeVisible();

// Performance validation
const totalTestTime = Date.now() - testStartTime;
console.log(`Total test time: ${totalTestTime}ms`);

// Error assertions
expect(jsErrors.length).toBe(0);
expect(networkErrors.length).toBe(0);
```

## 🏃‍♂️ Menjalankan Test

### Development
```bash
# Test spesifik
npx playwright test {feature-name}-analysis.spec.ts

# Dengan UI mode
npx playwright test {feature-name}-analysis.spec.ts --ui

# Headed mode (browser visible)
npx playwright test {feature-name}-analysis.spec.ts --headed

# Debug mode
npx playwright test {feature-name}-analysis.spec.ts --debug
```

### Cross-Browser Testing
```bash
# Menggunakan script PowerShell
.\tests\run-cross-browser-tests.ps1

# Manual per browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Results
```bash
# Show HTML report
npx playwright show-report
```

## 📊 Performance Thresholds

| Metric | Chromium | Firefox | WebKit |
|--------|----------|---------|--------|
| Load Time | 3000ms | 3000ms | 3500ms |
| Render Time | 2000ms | 2500ms | 2000ms |
| JS Heap Size | 50MB | 60MB | 40MB |
| DOM Nodes | 1500 | 1500 | 1500 |
| Network Latency | 1000ms | 1000ms | 1000ms |

## 🚨 Common Issues & Solutions

### 1. Element Not Found
```typescript
// Gunakan waitForSelector dengan timeout
await page.waitForSelector('selector', { timeout: 10000 });

// Atau gunakan expect dengan timeout
await expect(page.locator('selector')).toBeVisible({ timeout: 5000 });
```

### 2. Timing Issues
```typescript
// Gunakan waitForTimeout sesuai standar
await page.waitForTimeout(1000); // File menu
await page.waitForTimeout(2000); // Example data
await page.waitForTimeout(5000); // Dataset load
await page.waitForTimeout(3000); // Analysis execution
```

### 3. Performance Issues
```typescript
// Monitor dan log metrics
const metrics = await resourceMonitor.collectMetrics(page);
resourceMonitor.logMetrics(testInfo.title);

// Validate thresholds
const validation = resourceMonitor.validatePerformance();
if (!validation.passed) {
  console.warn('Performance issues:', validation.issues);
}
```

### 4. Error Handling
```typescript
// Filter known non-critical errors
page.on('pageerror', (error) => {
  if (!error.message.includes('ResizeObserver') && 
      !error.message.includes('Non-Error promise rejection')) {
    jsErrors.push(error.message);
  }
});
```

## 📚 Referensi

- **TESTING_STANDARDS.md** - Standar lengkap
- **TEMPLATE.spec.ts** - Template untuk test baru
- **README.md** - Setup dan commands
- **CROSS_BROWSER_TESTING.md** - Konfigurasi cross-browser
- **run-cross-browser-tests.ps1** - Script eksekusi

---

**Tips**: Selalu ikuti pattern yang sudah ada di `descriptive-analysis.spec.ts` dan `frequencies-analysis.spec.ts` untuk konsistensi.