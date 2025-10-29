import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseURL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  webServer: baseURL
    ? undefined
    : {
        command: 'npm run dev -- --host --mode e2e',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          VITE_E2E_MOCK: 'true',
        },
      },
  timeout: 60_000,
});
