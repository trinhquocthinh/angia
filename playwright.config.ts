import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SIT_ORIGIN } from './scripts/e2e/readSitConfig.js';

// Volume ngoài trên macOS sinh AppleDouble khiến bước dọn kết quả bị ENOTEMPTY.
const artifacts =
  process.env.E2E_ARTIFACT_DIR ??
  (process.platform === 'darwin' ? join(tmpdir(), 'angia-playwright') : '.playwright');

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/._*',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: join(artifacts, 'results'),
  reporter: [['list'], ['html', { outputFolder: join(artifacts, 'report'), open: 'never' }]],
  use: {
    baseURL: SIT_ORIGIN,
    ...(process.env.E2E_STORAGE_STATE ? { storageState: process.env.E2E_STORAGE_STATE } : {}),
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    reducedMotion: 'reduce',
    // Trace có thể chứa cookie/header. Chỉ giữ báo cáo assertion và PDF dữ liệu giả.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit-mobile',
      testMatch: '**/tc093*.spec.ts',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' },
    },
  ],
});
