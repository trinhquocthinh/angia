import { expect, test } from '@playwright/test';
import { householdInvitationFixture } from './householdInvitationFixture.js';
import { householdInvitationCases } from './householdInvitationCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E27 gửi lời mời — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    householdInvitationCases.forEach((register) => register());
    test('TC-773: chọn vai trò trước khi phát hành, mã thật và vai trò chuyển được', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      await page.goto('/family/invite');
      await expect(page.getByRole('heading', { name: 'Mời người thân', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tạo lời mời', exact: true })).toBeDisabled();
      expect(state.creates).toHaveLength(0);
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('A7F2 9C4E 8B1D');
      expect(state.creates).toEqual([{ body: { kind: 'join_family', role: 'member' }, csrf: 'csrf' }]);
      await expect(page.getByRole('radio', { name: /Đồng quản lý/ })).toBeEnabled();
      await expect(page.getByRole('radio', { name: /Thành viên/ })).toBeChecked();
      await page.reload();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('A7F2 9C4E 8B1D');
      expect(state.creates).toHaveLength(1);
    });
  });
}
