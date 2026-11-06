import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  testMatch: ['**/bodyMap2D.spec.ts', '**/regionList.spec.ts'],
  testIgnore: '**/._*',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  outputDir: join(tmpdir(), 'angia-body-map-playwright'),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    locale: 'vi-VN',
    reducedMotion: 'reduce',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium-touch',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, hasTouch: true },
    },
    { name: 'webkit-touch', use: { ...devices['iPhone 13'], viewport: { width: 360, height: 800 } } },
  ],
  webServer: {
    command: 'yarn workspace @angia/web exec vite --config vite.body-map.config.ts',
    url: 'http://127.0.0.1:5174/e2e/bodyMap2D.html',
    reuseExistingServer: false,
  },
});
