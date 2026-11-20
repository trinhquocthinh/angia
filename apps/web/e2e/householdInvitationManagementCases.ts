import { expect, test } from '@playwright/test';
import { householdInvitationFixture } from './householdInvitationFixture.js';
export const householdInvitationManagementCases = [
  () => {
    test('TC-773: mở xác nhận thu hồi thì focus ở nút Giữ lời mời', async ({ page }) => {
      await householdInvitationFixture(page);
      await page.goto('/family/invite');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Giữ lời mời', exact: true }),
      ).toBeFocused();
    });
  },
  () => {
    test('TC-773: chọn rồi tạo, hai mã độc lập; đi ra/vào và reload nhớ vai trò', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      await page.goto('/family/invite');
      await expect(page.getByRole('button', { name: 'Tạo lời mời', exact: true })).toBeDisabled();
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      expect(state.creates).toHaveLength(0);
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('A7F2 9C4E 8B1D');
      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      expect(state.creates).toHaveLength(1);
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('1234 56AB CDEF');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('A7F2 9C4E 8B1D');
      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      await page.goto('/');
      await page.goto('/family/invite');
      await page.reload();
      await expect(page.getByRole('radio', { name: /Đồng quản lý/ })).toBeChecked();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('1234 56AB CDEF');
      expect(state.creates).toHaveLength(2);
      await expect(page.getByRole('button', { name: 'Danh sách lời mời' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Thu hồi và tạo mã mới' })).toHaveCount(0);
    });
  },
  () => {
    test('TC-773: sao chép nhiều lần chỉ một toast, khối mã và nút không dịch chuyển', async ({ page }) => {
      await householdInvitationFixture(page);
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: async () => undefined },
          configurable: true,
        }),
      );
      await page.goto('/family/invite');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      const copy = page.getByRole('button', { name: 'Sao chép mã', exact: true });
      await copy.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const before = await copy.boundingBox();
      for (let i = 0; i < 5; i++) await copy.click();
      await expect(page.getByRole('status').filter({ hasText: 'Đã sao chép mã mời.' })).toHaveCount(1);
      expect(await copy.boundingBox()).toEqual(before);
      expect(await copy.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');
    });
  },
  () => {
    test('TC-777: mở lại mã hết hạn gạch ngang, không sao chép, tạo mới giữ vai trò', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      state.entries = [
        {
          ...state.issued,
          role: 'member',
          own: true,
          status: 'expired',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          secrets: { code: state.issued.code, link: state.issued.link },
        },
      ];
      await page.goto('/family/invite');
      await expect(page.getByText('Mã đã hết hạn', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveText('A7F2 9C4E 8B1D');
      await expect(page.getByRole('button', { name: 'Sao chép mã', exact: true })).toBeDisabled();
      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      await expect(page.getByRole('button', { name: 'Tạo lời mời', exact: true })).toBeEnabled();
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời mới', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Sao chép mã', exact: true })).toBeEnabled();
      expect(state.creates).toHaveLength(1);
    });
  },
  () => {
    test('TC-773: tải lỗi không cho tạo; legacy vẫn thu hồi được, không có lịch sử', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      state.listError = true;
      await page.goto('/family/invite');
      await expect(page.getByRole('alert')).toContainText('Chưa thể tải lời mời');
      await expect(page.getByRole('button', { name: 'Tạo lời mời', exact: true })).toHaveCount(0);
      state.listError = false;
      state.entries = [
        {
          ...state.issued,
          role: 'member',
          own: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          secrets: null,
        },
      ];
      await page.getByRole('button', { name: 'Thử tải lại' }).click();
      await expect(page.getByText('Mã cũ không thể xem lại')).toBeVisible();
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await page.keyboard.press('Escape');
      expect(state.revokes).toHaveLength(0);
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      expect(state.revokes).toHaveLength(1);
    });
  },
  () => {
    test('TC-773: 360px/chữ 200% và đổi vai trò không tràn', async ({ page }) => {
      await householdInvitationFixture(page);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/family/invite');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      await page.evaluate(() => document.fonts.ready);
      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  },
];
