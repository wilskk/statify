// Simplified browser smoke test for Statify
import { browser } from "k6/browser";
import { check } from "k6";

export const options = {
  scenarios: {
    browser_smoke: {
      executor: "shared-iterations",
      iterations: 1,
      vus: 1,
      maxDuration: '3m',
      options: { 
        browser: { 
          type: "chromium"
        } 
      },
    },
  },
  thresholds: {
    browser_web_vital_fcp: ["p(95)<5000"],
    browser_web_vital_lcp: ["p(95)<8000"],
    checks: ["rate>0.7"],
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    console.log('Starting browser test...');
    
    // Navigate to Statify
    await page.goto('https://statify-dev.student.stis.ac.id/dashboard/data', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    console.log('Page loaded, checking elements...');
    
    // Basic checks
    check(page, {
      'page loaded successfully': () => page.url().includes('statify-dev.student.stis.ac.id'),
      'page title exists': () => page.title().length > 0,
    });
    
    // Wait for basic UI elements
    try {
      await page.waitForSelector('[data-testid="file-menu-trigger"]', { timeout: 15000 });
      
      check(page, {
        'file menu button exists': () => true,
      });
      
      console.log('File menu found, testing click...');
      await page.locator('[data-testid="file-menu-trigger"]').click();
      await page.waitForTimeout(2000);
      
      check(page, {
        'file menu interaction successful': () => true,
      });
      
    } catch (e) {
      console.log('File menu not found or interaction failed:', e.message);
      check(false, {
        'file menu button exists': () => false,
      });
    }

  } catch (error) {
    console.error('Browser test failed:', error.message);
    check(false, {
      'browser test completed without errors': () => false,
    });
  } finally {
    console.log('Closing browser...');
    await page.close();
  }
}
