import { adminRegistrationRecoveryCases } from './adminRegistrationRecoveryCases.js';
import { adminRegistrationSwitchCases } from './adminRegistrationSwitchCases.js';
import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';
import { adminRegistrationInvitationCases } from './adminRegistrationInvitationCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E31 quản trị đăng ký — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    adminRegistrationSwitchCases();
    adminRegistrationInvitationCases();
    adminRegistrationRecoveryCases();
    test('TC-834: thành viên không có hộp tương tác quản trị', async ({ page }) => {
      const state = await householdStartFixture(page);
      state.family = true;
      state.role = 'member';
      await page.goto('/admin');
      await expect(page.getByRole('switch', { name: 'Cho phép tự đăng ký' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tạo lời mời lập nhà' })).toHaveCount(0);
      expect(state.registrationWrites).toHaveLength(0);
    });
  });
}
