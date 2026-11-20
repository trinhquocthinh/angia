import { expect, test } from '@playwright/test';
import { MINOR_PROFILE_ID, profileGuardiansFixture } from './profileGuardiansFixture.js';

export const profileGuardiansSafetyCases = [
  ...['linked', 'unknown', 'member'].map((mode) => () => {
    test(`ẩn Người giám hộ khi không đủ điều kiện: ${mode}`, async ({ page }) => {
      const state = await profileGuardiansFixture(page);
      if (mode === 'linked') state.linked = true;
      if (mode === 'unknown') state.birthYear = null;
      if (mode === 'member') state.household.role = 'member';
      const reads: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/') && request.url().endsWith('/guardians'))
          reads.push(request.url());
      });
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);
      if (mode === 'member') {
        await expect(page.getByRole('main').first()).toBeVisible();
      } else {
        await expect(page.getByText('Hồ sơ này không cần người giám hộ.')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Người giám hộ' })).toHaveCount(0);
      }
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toHaveCount(0);
      expect(reads).toEqual([]);
    });
  }),
  () =>
    test('lỗi thêm hiển thị thông điệp chung, không đóng hộp thoại hoặc báo thành công', async ({ page }) => {
      const state = await profileGuardiansFixture(page);
      state.addError = 500;
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);
      await page.getByRole('button', { name: 'Thêm người giám hộ' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Ba Minh · Chủ hộ').check();
      await dialog.getByRole('button', { name: 'Thêm', exact: true }).click();
      await expect(dialog.getByRole('alert')).toHaveText('Chưa lưu được. Thử lại sau.');
      await expect(page.getByText('Đã thêm người giám hộ')).toHaveCount(0);
      await expect(dialog.getByRole('button', { name: 'Thêm', exact: true })).toBeEnabled();
    }),
  () =>
    test('đang thêm khoá nút, Escape và cuộn; thành công refetch giám hộ', async ({ page }) => {
      await profileGuardiansFixture(page);
      let release!: () => void;
      const hold = new Promise<void>((resolve) => {
        release = resolve;
      });
      let writes = 0;
      await page.route(`**/api/health-profiles/${MINOR_PROFILE_ID}/guardians`, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        writes += 1;
        await hold;
        return route.fallback();
      });
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);
      await page.getByRole('button', { name: 'Thêm người giám hộ' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Ba Minh · Chủ hộ').check();
      await dialog.getByRole('button', { name: 'Thêm', exact: true }).click();
      try {
        await expect(dialog.getByRole('button', { name: 'Đang thêm…' })).toBeDisabled();
        await expect(dialog.getByRole('button', { name: 'Huỷ' })).toBeDisabled();
        await expect(dialog.getByLabel('Ba Minh · Chủ hộ')).toBeDisabled();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeVisible();
        await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
        expect(writes).toBe(1);
      } finally {
        release();
      }
      await expect(dialog).toHaveCount(0);
      await expect(page.getByText('2/2 Đã đủ')).toBeVisible();
      await expect(page.getByText('Đã thêm người giám hộ')).toBeVisible();
    }),
];
