import { defineConfig, devices } from '@playwright/test';

// Base URL can be overridden via env: BASE_URL
const BASE_URL = process.env.BASE_URL || 'https://statify-dev.student.stis.ac.id';
// Video mode can be overridden via env: VIDEO_MODE (on|off|retain-on-failure|on-first-retry)
const VIDEO_MODE = (process.env.VIDEO_MODE as 'on' | 'off' | 'retain-on-failure' | 'on-first-retry') || 'on';

export default defineConfig({
  testDir: 'tests/playwright',
  // Increase per-test timeout to accommodate longer UI flows (e.g., dataset import)
  timeout: 180_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-testid',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: VIDEO_MODE,
    viewport: { width: 1366, height: 768 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  expect: {
    timeout: 20_000,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to run on more browsers locally if desired
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
