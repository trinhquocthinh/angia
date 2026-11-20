import { test } from '@playwright/test';
import { profileGuardiansSafetyCases } from './profileGuardiansSafetyCases.js';
import { profileGuardiansCases } from './profileGuardiansCases.js';

for (const theme of ['light', 'dark'])
  test.describe(`Người giám hộ hồ sơ trẻ — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    profileGuardiansSafetyCases.forEach((register) => register());
    profileGuardiansCases.forEach((register) => register());
  });
