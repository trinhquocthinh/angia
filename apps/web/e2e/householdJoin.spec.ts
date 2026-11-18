import { test } from '@playwright/test';
import { householdJoinCases } from './householdJoinCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E27 nhận mã — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdJoinCases.forEach((register) => register());
  });
}
