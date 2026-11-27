import { test } from '@playwright/test';
import { householdInviteLinkJoinCases } from './householdInviteLinkJoinCases.js';
import { householdInviteLinkAuthCases } from './householdInviteLinkAuthCases.js';
import { householdInviteLinkErrorCases } from './householdInviteLinkErrorCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E27-AT-D1 nhận link — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdInviteLinkJoinCases.forEach((register) => register());
    householdInviteLinkAuthCases.forEach((register) => register());
    householdInviteLinkErrorCases.forEach((register) => register());
  });
}
