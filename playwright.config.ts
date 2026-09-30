import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true,
  snapshotPathTemplate: '{testDir}/references/{arg}{ext}',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'node scripts/serve-static.mjs', url: `http://127.0.0.1:4173${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`, reuseExistingServer: false, gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 } },
});
