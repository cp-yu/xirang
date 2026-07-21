import { defineConfig, devices } from '@playwright/test'

const port = 43118

export default defineConfig({
  testDir: './test/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      grep: /browses absent/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      grep: /mobile dialog/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `node ../../../bin/opsx.js view --port ${port}`,
    cwd: './test/fixtures/spec-browser',
    port,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
