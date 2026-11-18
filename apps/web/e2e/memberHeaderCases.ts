import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';
export const memberHeaderCases = [
  () => {
    test('TC-767: Thành viên đã liên kết vẫn có điều hướng cá nhân', async ({ page }) => {
      const state = await householdStartFixture(page);
      Object.assign(state, { family: true, role: 'member', linked: true });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Hồ sơ của tôi', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: /Chờ duyệt|Tải giấy tờ|Thêm mới/ })).toHaveCount(0);
    });
  },
  () => {
    test('TC-767: quản lý chưa liên kết vẫn có search desktop và tab quản lý', async ({ page }) => {
      const state = await householdStartFixture(page);
      Object.assign(state, { family: true, role: 'main', linked: false });
      await page.goto('/');
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Tìm hồ sơ thành viên', includeHidden: true }),
      ).toHaveCount(1);
    });
  },
  () => {
    test('TC-767: header có back chỉ giữ tiêu đề và tài khoản; header không back vẫn có logo', async ({
      page,
    }) => {
      const state = await householdStartFixture(page);
      state.family = true;
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/notifications');
      const header = page
        .locator('header')
        .filter({ has: page.getByRole('link', { name: 'Về AN GIA', exact: true }) });
      await expect(header.getByText('Thông báo thiết bị', { exact: true })).toBeVisible();
      await expect(header.locator('img[src="/logo.webp"]')).toHaveCount(0);
      await expect(header.getByRole('button', { name: 'Tài khoản', exact: true })).toBeVisible();
      await page.getByRole('link', { name: 'Về AN GIA', exact: true }).click();
      await page.goto('/?view=profiles');
      await expect(page.getByRole('link', { name: 'AN GIA', exact: true })).toBeVisible();
    });
  },
];
