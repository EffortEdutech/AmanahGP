// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:       './tests',
  fullyParallel: false,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 1 : 0,
  workers:       1,
  reporter:      'list',
  timeout:       30_000,

  use: {
    baseURL:    process.env.USER_APP_URL ?? 'http://localhost:3300',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    headless:   true,
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    // Mobile disabled until webkit is installed:
    // npx playwright install webkit
    // {
    //   name: 'mobile',
    //   use:  { ...devices['iPhone 14'] },
    // },
  ],
});
