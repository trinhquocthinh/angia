import { test } from '@playwright/test';
import { householdMembersCases } from './householdMembersCases.js';

for (const theme of ['light', 'dark'])
  test.describe(`Thành viên trong nhà — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdMembersCases.forEach((register) => register());
  });
