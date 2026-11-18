import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { byLabel, checkAccountLayout } from './accountChecks.js';
import { accountSecurityFixture } from './accountSecurityFixture.js';

async function returnFromReauth(page: Page) {
  await page.evaluate(() => sessionStorage.setItem('angia.enrollReauth', String(Date.now())));
  await page.goto('/');
  await expect(page).toHaveURL(/\/account\/local-password$/);
  await expect(page.getByText('Đã xác minh. Hãy đặt mật khẩu trong 5 phút.', { exact: true })).toBeVisible();
}
async function savePassword(page: Page) {
  await byLabel(page, 'Mật khẩu mới').fill('matkhaumoi123');
  await byLabel(page, 'Nhập lại mật khẩu mới').fill('matkhaumoi123');
  await page.getByRole('button', { name: 'Lưu mật khẩu', exact: true }).click();
}
async function enrollmentSettles(page: Page, withoutFamily: boolean) {
  const state = await accountSecurityFixture(page);
  Object.assign(state, { enrollment: true, withoutFamily });
  await page.goto('/account/local-password');
  await returnFromReauth(page);
  const readsBeforeSave = state.meReads;
  let navigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  await savePassword(page);
  const destination = withoutFamily ? /\/waiting$/ : /\/$/;
  const heading = withoutFamily ? 'Bắt đầu' : 'Liều hôm nay';
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  // Quan sát đủ ba giây để phát hiện vòng lặp, không dùng để đồng bộ thao tác lưu.
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  expect(state.meReads - readsBeforeSave).toBeLessThanOrEqual(5);
  expect(navigations).toBeLessThanOrEqual(3);
  expect(state.hasLocalCredential).toBe(true);
  expect(state.enrollment).toBe(true);
  expect(await page.evaluate(() => sessionStorage.getItem('angia.enrollReauth'))).toBeNull();
}
function enrollmentCompletionCases(theme: string) {
  test(`TC-900: admin không được mời enrollment — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    Object.assign(state, { enrollment: true, adminWithoutFamily: true });
    const paths: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống', exact: true })).toBeVisible();
    expect(paths).not.toContain('/account/local-password');
    await page.goto('/account/local-password');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống', exact: true })).toBeVisible();
    await expect(byLabel(page, 'Mật khẩu mới')).toHaveCount(0);
    expect(state.hasLocalCredential).toBe(false);
    expect(state.writes.some((write) => write.path === '/api/me/local-credential')).toBe(false);
  });
  test(`TC-900: account thường không nhà lưu mật khẩu xong về /waiting không treo — ${theme}`, async ({
    page,
  }) => {
    await enrollmentSettles(page, true);
  });
  test(`TC-900: account có nhà lưu mật khẩu xong về / không treo — ${theme}`, async ({ page }) => {
    await enrollmentSettles(page, false);
  });
}
export function accountEnrollmentCases(theme: string) {
  enrollmentCompletionCases(theme);
  test(`TC-751/900: mời enrollment, xác minh lại rồi lưu mật khẩu — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.enrollment = true;
    await page.route('**/api/auth/login?reauth=1', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<p>Authentification simulée</p>' }),
    );
    await page.goto('/');
    await expect(page).toHaveURL(/\/account\/local-password$/);
    await expect(page.getByRole('heading', { name: 'Đặt mật khẩu cho AN GIA' })).toBeVisible();
    await checkAccountLayout(page);
    await expect(page.getByText('Tên đăng nhập', { exact: true })).toHaveCount(0);
    const reauth = page.waitForRequest((request) => request.url().endsWith('/api/auth/login?reauth=1'));
    await page.getByRole('button', { name: 'Xác minh lại', exact: true }).click();
    await reauth;
    await expect(page).toHaveURL(/\/api\/auth\/login\?reauth=1$/);
    expect(await page.evaluate(() => Number(sessionStorage.getItem('angia.enrollReauth')))).toBeGreaterThan(
      0,
    );
    await page.goto('/');
    await expect(page).toHaveURL(/\/account\/local-password$/);
    await expect(
      page.getByText('Đã xác minh. Hãy đặt mật khẩu trong 5 phút.', { exact: true }),
    ).toBeVisible();
    await savePassword(page);
    await expect(page).toHaveURL(/\/$/);
    expect(state.writes.at(-1)).toEqual({
      path: '/api/me/local-credential',
      body: { password: 'matkhaumoi123' },
      csrf: 'csrf',
    });
    expect(await page.evaluate(() => sessionStorage.getItem('angia.enrollReauth'))).toBeNull();
  });
  test(`TC-901: server từ chối reauth quay lại xác minh — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.enrollment = true;
    state.credentialStatus = 403;
    await page.goto('/account/local-password');
    await returnFromReauth(page);
    await savePassword(page);
    await expect(page.getByRole('button', { name: 'Xác minh lại', exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('Phiên xác minh đã hết hạn. Vui lòng xác minh lại.');
    await expect(byLabel(page, 'Mật khẩu mới')).toHaveCount(0);
  });
  test(`để sau ngừng mời enrollment trong tab hiện tại — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.enrollment = true;
    await page.goto('/');
    await expect(page).toHaveURL(/\/account\/local-password$/);
    await page.getByRole('button', { name: 'Để sau', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => sessionStorage.getItem('angia.enrollLater'))).toBe('1');
  });
}
