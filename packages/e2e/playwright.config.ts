import pkg from '@playwright/test';
const { defineConfig, devices } = pkg;

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'src',

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html', { outputFolder: '../../reports/playwright' }]],

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://0.0.0.0:20000',

    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      headless: true,
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      headless: true,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      headless: true,
    },
  ],
});
