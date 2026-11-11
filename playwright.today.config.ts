import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Route sản phẩm từ bản build, API giả; không ghi dữ liệu lên SIT.
export default defineConfig({
  testDir: './apps/web/e2e',
  testMatch: '**/today.spec.ts',
  testIgnore: '**/._*',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  outputDir: join(tmpdir(), 'angia-today-playwright'),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5176',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
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
    command: 'yarn workspace @angia/web exec vite preview --host 127.0.0.1 --port 5176 --strictPort',
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: false,
  },
});
