import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';

export const householdMemberResizeCases = [
  ...[390, 1280].map((width) => () => {
    test(`E28-S3-T2b: resize khi xác nhận gỡ từ ${width}px vẫn đóng đúng modal và không gửi PATCH`, async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/family/home');
      const row = page.getByRole('button', { name: /Mẹ Hoa/ });
      await row.click();
      await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();
      const confirm = page.getByRole('dialog', { name: 'Gỡ Mẹ Hoa khỏi nhà?', exact: true });
      const targetWidth = width < 1024 ? 1280 : 390;
      await page.setViewportSize({ width: targetWidth, height: 900 });
      await expect(confirm).toBeVisible();
      await expect(confirm.getByRole('button', { name: 'Huỷ', exact: true })).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      const sheet = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      if (targetWidth < 1024) {
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('button', { name: 'Đóng chi tiết thành viên' })).toBeFocused();
      } else {
        await expect(sheet).toHaveCount(0);
        await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      }
      if (targetWidth >= 1024) await row.focus();
      // Escape ở sheet hoặc panel đều đóng chi tiết, không tác động tới dữ liệu.
      if (targetWidth < 1024) await sheet.getByRole('button', { name: 'Đóng chi tiết thành viên' }).focus();
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(row).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  }),
];
