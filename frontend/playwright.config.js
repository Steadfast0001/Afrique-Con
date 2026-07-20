const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npx concurrently "npm run start:auth" "npm run preview -- --port 5173"',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
