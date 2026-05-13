import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321', headless: true },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    timeout: 60_000,
    reuseExistingServer: true,
  },
});
