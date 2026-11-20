import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /responsive\.spec\.ts/,
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.ts/ },
    // Cross-browser: Firefox (Gecko) and WebKit (Safari's engine).
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
      testIgnore: /responsive\.spec\.ts/,
    },
    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
      testIgnore: /responsive\.spec\.ts/,
    },
    { name: 'mobile-webkit', use: { ...devices['iPhone 14'] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    // Tests run against the production build (closest to what gets deployed).
    command: `node .output/server/index.mjs`,
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
