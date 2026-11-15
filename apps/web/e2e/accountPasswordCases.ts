import { expect, test } from '@playwright/test';
import { byLabel, checkAccountLayout, fillLogin } from './accountChecks.js';
import { accountSecurityFixture } from './accountSecurityFixture.js';

export function accountPasswordCases(theme: string) {
  test(`TC-748/749: phiên hạn chế, kiểm mật khẩu và lưu thành công — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.signedIn = false;
    await page.goto('/login');
    await fillLogin(page);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/account\/change-password$/);
    await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeVisible();
    await checkAccountLayout(page);
    await byLabel(page, 'Mật khẩu mới').fill('ngan');
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('ngan');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await expect(page.getByText('Mật khẩu cần ít nhất 8 ký tự.', { exact: true })).toBeVisible();
    await expect(byLabel(page, 'Mật khẩu mới')).toBeFocused();
    await expect(byLabel(page, 'Mật khẩu mới')).toHaveAttribute('aria-invalid', 'true');
    await byLabel(page, 'Mật khẩu mới').fill('matkhaumoi123');
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('khongkhop123');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await expect(page.getByText('Hai mật khẩu chưa khớp.', { exact: true })).toBeVisible();
    await expect(byLabel(page, 'Nhập lại mật khẩu mới')).toBeFocused();
    expect(state.writes.filter((write) => write.path === '/api/me/password')).toEqual([]);
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('matkhaumoi123');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(state.writes.at(-1)).toEqual({
      path: '/api/me/password',
      body: { newPassword: 'matkhaumoi123' },
      csrf: 'csrf',
    });
    expect(await page.evaluate(() => sessionStorage.getItem('angia.restrictedCsrf'))).toBeNull();
  });
  test(`TC-748: tải lại khi mất token yêu cầu đăng nhập lại — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.restricted = true;
    await page.goto('/account/change-password');
    await page.reload();
    await expect(page.getByText('Vui lòng đăng nhập lại.', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toHaveAttribute(
      'href',
      '/login',
    );
    await expect(page.locator('form')).toHaveCount(0);
  });
}
