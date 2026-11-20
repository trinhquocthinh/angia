import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';

export const householdMemberResizeCases = [
  ...[390, 1280].map((width) => () => {
    test(`E28-S3-T3: resize khi xác nhận gỡ từ ${width}px, Escape chỉ đóng hộp xác nhận và giữ popup ngoài`, async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/family/home');
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      const detail = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      const removeTrigger = detail.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true });
      await removeTrigger.click();
      const confirm = page.getByRole('dialog', { name: 'Gỡ Mẹ Hoa khỏi nhà?', exact: true });
      const targetWidth = width < 1024 ? 1280 : 390;
      await page.setViewportSize({ width: targetWidth, height: 900 });
      await expect(confirm).toBeVisible();
      await expect(confirm.getByRole('button', { name: 'Huỷ', exact: true })).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(detail).toBeVisible();
      await expect(removeTrigger).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(detail).toHaveCount(0);
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  }),
];
