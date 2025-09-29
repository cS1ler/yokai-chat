import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }],
})
