import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000, // Increased timeout for comprehensive tests
  expect: { timeout: 10_000 }, // Increased expect timeout
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1, // Add retry for dev environment
  workers: process.env.CI ? 4 : 8, // More workers for faster parallel execution
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000, // Increased action timeout
  },
  projects: [
    // Desktop browsers - Primary testing
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.ts']
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/*.spec.ts']
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/*.spec.ts']
    },

    // Mobile devices - Representative selection
    {
      name: 'iPhone 12',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/mobile-behavior.spec.ts', '**/responsive-design.spec.ts']
    },
    {
      name: 'iPhone 14',
      use: { 
        ...devices['iPhone 14'],
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/mobile-behavior.spec.ts']
    },
    {
      name: 'Pixel 7',
      use: { 
        ...devices['Pixel 7'],
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/mobile-behavior.spec.ts', '**/responsive-design.spec.ts']
    },
    {
      name: 'Samsung Galaxy S23',
      use: { 
        ...devices['Galaxy S8'], // Close approximation
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/mobile-behavior.spec.ts']
    },

    // Tablets
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/responsive-design.spec.ts', '**/interactive-elements.spec.ts']
    },
    {
      name: 'iPad Mini',
      use: { 
        ...devices['iPad Mini'],
        hasTouch: true
      },
      testMatch: ['**/core-pages.spec.ts', '**/responsive-design.spec.ts']
    },

    // Different desktop resolutions
    {
      name: 'Desktop 1920x1080',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/responsive-design.spec.ts', '**/interactive-elements.spec.ts']
    },
    {
      name: 'Desktop 1366x768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
      testMatch: ['**/responsive-design.spec.ts']
    },
    
    // Accessibility focused tests
    {
      name: 'Accessibility Tests',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate screen reader preferences
        colorScheme: 'light'
      },
      testMatch: ['**/accessibility-performance.spec.ts']
    }
  ],
});


