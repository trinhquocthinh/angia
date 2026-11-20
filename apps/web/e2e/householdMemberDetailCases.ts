import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';

export const householdMemberDetailCases = [
  ...[390, 1023, 1024, 1280].map((width) => () => {
    test(`E28-S3-T2b: chọn hàng tại ${width}px, Escape đóng và trả focus sau click`, async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/family/home');
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      await expect(row).toHaveAttribute('aria-pressed', 'true');
      const sheet = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      if (width < 1024) {
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('button', { name: 'Đóng chi tiết thành viên' })).toBeFocused();
        await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
        await page.keyboard.press('Tab');
        expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      } else {
        await expect(sheet).toHaveCount(0);
        await expect(page.locator('.household-members-detail-rail')).toContainText('Mẹ Hoa');
      }
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(row).toHaveAttribute('aria-pressed', 'false');
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  }),
  () => {
    test('E28-S3-T2b: đổi qua mốc 1024px khi mở không kẹt modal, focus hay cuộn nền', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width: 1024, height: 900 });
      await page.goto('/family/home');
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      const sheet = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      for (const width of [1023, 1024, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByRole('radio', { name: /Đồng quản lý/ })).toBeChecked();
        if (width < 1024) {
          await expect(sheet).toBeVisible();
          await expect(sheet.getByRole('button', { name: 'Đóng chi tiết thành viên' })).toBeFocused();
          await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
        } else {
          await expect(sheet).toHaveCount(0);
          await expect(row).toBeFocused();
          await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
        }
      }
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  },
];
