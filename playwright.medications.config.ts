import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import today from './playwright.today.config.js';

export default defineConfig({
  ...today,
  testMatch: '**/medicationsPrescriptions.spec.ts',
  outputDir: join(tmpdir(), 'angia-medications-playwright'),
});
