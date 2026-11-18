import { test } from '@playwright/test';
import { householdInvitationManagementCases } from './householdInvitationManagementCases.js';
for (const theme of ['light', 'dark'])
  test.describe(`Quản lý lời mời — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdInvitationManagementCases.forEach((register) => register());
  });
