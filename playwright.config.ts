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
      grep: /browses Element Contracts|opens an Authored View|keeps View source|browses Model View|handles ADDED projection|refreshes the model through HMR|renders each Change presentation mode|expands in place|bounded projection request count|double-click navigation settles|browses the complete candidate model|reviews candidate changes in diff only mode|keeps invalid candidate sources diagnosable|shows candidate cards on the landing page|applies kind presentation|keeps operation color|exports a hierarchy tree|exports the current focus|exports a change source|exports without a snapshot|exports the complete model structure for file formats/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile',
      grep: /mobile Contract dialog|browses Model View|handles ADDED projection|refreshes the model through HMR|renders each Change presentation mode|browses the complete candidate model|reviews candidate changes in diff only mode|keeps invalid candidate sources diagnosable|shows candidate cards on the landing page|applies kind presentation|keeps operation color|exports a hierarchy tree|exports the current focus|exports a change source|exports without a snapshot|exports the complete model structure for file formats/,
      use: { ...devices['Pixel 7'], channel: 'chrome' },
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
