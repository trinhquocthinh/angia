import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import today from './playwright.today.config.js';

export default defineConfig({
  ...today,
  testMatch: '**/healthLabsTemp.spec.ts',
  outputDir: join(tmpdir(), 'angia-health-playwright'),
});
