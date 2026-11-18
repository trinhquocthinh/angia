import { test } from '@playwright/test';
import { householdCreationCases } from './householdCreationCases.js';
import { householdRecoveryCases } from './householdRecoveryCases.js';
import { householdShellCases } from './householdShellCases.js';
import { householdDesignCases } from './householdDesignCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E27 bắt đầu — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdCreationCases();
    householdRecoveryCases();
    householdShellCases(theme);
    householdDesignCases(theme);
  });
}
