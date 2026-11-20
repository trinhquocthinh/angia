import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';

export const householdMemberDetailCases = [
  ...[390, 1023, 1024, 1280].map((width) => () => {
    test(`E28-S3-T3: chọn hàng tại ${width}px mở popup modal, khoá cuộn, Escape đóng và trả focus`, async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/family/home');
      await expect(page.locator('.household-members-detail-rail')).toHaveCount(0);
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      await expect(row).toHaveAttribute('aria-pressed', 'true');
      const dialog = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Mẹ Hoa');
      await expect(dialog.getByRole('button', { name: 'Đóng chi tiết thành viên' })).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(row).toHaveAttribute('aria-pressed', 'false');
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  }),
  () => {
    test('E28-S3-T3: đổi qua mốc 1024px khi mở popup không mất trạng thái, focus hay khoá cuộn', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width: 1024, height: 900 });
      await page.goto('/family/home');
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      const dialog = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('radio', { name: /Đồng quản lý/ }).check();
      for (const width of [1023, 1024, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('radio', { name: /Đồng quản lý/ })).toBeChecked();
        await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  },
];
