import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Route sản phẩm từ bản build, API giả, không ghi dữ liệu thật.
export default defineConfig({
  testDir: './apps/web/e2e',
  testMatch: [
    '**/loginClayIcons.spec.ts',
    '**/mobileBottomNav.spec.ts',
    '**/account.spec.ts',
    '**/householdStart.spec.ts',
    '**/householdInvitations.spec.ts',
    '**/householdJoin.spec.ts',
    '**/householdInvitationManagement.spec.ts',
    '**/householdMembers.spec.ts',
    '**/householdHome.spec.ts',
  ],
  testIgnore: '**/._*',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 30_000,
  outputDir: join(tmpdir(), 'angia-account-playwright'),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5177',
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
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
    { name: 'webkit-touch', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'yarn workspace @angia/web exec vite preview --host 127.0.0.1 --port 5177 --strictPort',
    url: 'http://127.0.0.1:5177',
    reuseExistingServer: false,
  },
});
