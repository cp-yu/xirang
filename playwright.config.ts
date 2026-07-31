import { defineConfig, devices } from '@playwright/test'

const port = 43118

export default defineConfig({
  testDir: './test/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalTeardown: './test/e2e/cleanup-generated-cache.ts',
  use: {
    baseURL: `http://localhost:${port}`,
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      grep: /browses Element Contracts|opens an Authored View|keeps View source|browses Model View|expands in place/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      grep: /mobile Contract dialog|browses Model View/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `node ../../../bin/xirang.js view --port ${port}`,
    cwd: './test/fixtures/contract-browser',
    port,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
