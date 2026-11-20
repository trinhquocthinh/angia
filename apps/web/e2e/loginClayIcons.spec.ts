import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { accountFixture } from './accountFixture.js';
import { byLabel } from './accountChecks.js';

for (const theme of ['light', 'dark']) {
  test.describe(`Icon đất sét đăng nhập — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
      await accountFixture(page);
    });
    registerAssetCase(theme);
    registerResponsiveCase();
  });
}

function registerAssetCase(theme: string) {
  test('đúng SVG theo thiết bị, đăng ký dùng chung ba icon tiện ích', async ({ page }, info) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    const desktop = info.project.name.includes('desktop');
    const names = desktop
      ? ['medication', 'heart', 'family', 'lock', 'user', 'key']
      : ['lock', 'user', 'key'];
    for (const name of names) {
      const icon = page.locator(`.login-clay-icon-${name} img`);
      await expect(icon).toBeVisible();
      await expect
        .poll(() =>
          icon.evaluate((img: HTMLImageElement) =>
            img.complete && img.naturalWidth > 0 ? new URL(img.currentSrc).pathname : '',
          ),
        )
        .toBe(`/images/login/clay/${desktop ? 'desktop' : 'mobile'}-${name}.svg`);
    }
    const feature = page.locator('.login-desktop-features');
    if (desktop) await expect(feature).toBeVisible();
    else await expect(feature).toBeHidden();
    await mkdir('/tmp/angia-login-3d-stitch/screenshots', { recursive: true });
    await page.screenshot({
      path: `/tmp/angia-login-3d-stitch/screenshots/${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    await page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('.login-brand-panel .login-clay-icon')).toHaveCount(3);
    await expect(page.locator('.login-form-panel .login-clay-icon')).toHaveCount(0);
  });
}

function registerResponsiveCase() {
  test('đổi đúng icon tại 1024px, chữ 200% và hiện/ẩn mật khẩu', async ({ page }) => {
    await page.goto('/login');
    const userIcon = page.locator('.login-clay-icon-user img');
    for (const width of [1023, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          userIcon.evaluate((img: HTMLImageElement) =>
            img.complete && img.currentSrc ? new URL(img.currentSrc).pathname : '',
          ),
        )
        .toBe(`/images/login/clay/${width < 1024 ? 'mobile' : 'desktop'}-user.svg`);
    }
    const password = byLabel(page, 'Mật khẩu');
    await password.fill('matkhau123');
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expect(userIcon).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
