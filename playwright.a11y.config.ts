import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import today from './playwright.today.config.js';

const artifacts =
  process.platform === 'darwin' ? join(tmpdir(), 'angia-a11y-playwright') : '.playwright/a11y';

export default defineConfig({
  ...today,
  testMatch: '**/a11y/*.spec.ts',
  outputDir: join(artifacts, 'results'),
  reporter: [['list'], ['html', { outputFolder: join(artifacts, 'report'), open: 'never' }]],
});
