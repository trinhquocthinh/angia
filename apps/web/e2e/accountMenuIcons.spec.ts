import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

for (const theme of ['light', 'dark']) {
  test(`Icon menu 3D: asset có tải, nền trong và liên kết giữ nguyên — ${theme}`, async ({ page }) => {
    const state = await householdStartFixture(page);
    Object.assign(state, { family: true, role: 'member', linked: true });
    await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    await page.goto('/?view=profiles');
    const bell = page.getByRole('link', { name: 'Cài đặt thông báo', exact: true }).filter({ visible: true });
    await expect(bell).toHaveAttribute('href', '/notifications');
    await expect
      .poll(() =>
        bell.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    const trigger = page.getByRole('button', { name: 'Tài khoản', exact: true }).filter({ visible: true });
    await trigger.click();
    const menu = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
    for (const [label, path, icon] of [
      ['Nhà của tôi', '/family/home', 'home'],
      ['Hồ sơ của tôi', '/my-profile', 'profile-card'],
      ['Quản lý tài khoản', '/account', 'account-settings'],
    ] as const) {
      const link = menu.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', path);
      await expect(link.locator('img')).toHaveAttribute('src', `/images/account-menu/${icon}-3d.png`);
    }
    await expectMenuCopy(menu);
    const icons = menu.locator('.account-menu-clay-icon');
    await expect(icons).toHaveCount(4);
    for (const icon of await icons.all()) {
      await expect
        .poll(() => icon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
        .toBe(true);
      await expect(icon).toHaveCSS('width', '40px');
      await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(icon).toHaveCSS('border-top-width', '0px');
      await expect(icon).toHaveCSS('box-shadow', 'none');
    }
    await expect(menu.locator('.account-menu-logout img')).toHaveAttribute(
      'src',
      '/images/account-menu/logout-3d.png',
    );
    await expect(menu.getByText('Nền giao diện', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/angia-clay-menu-${theme}-${test.info().project.name}.png` });
    await menu.getByRole('link', { name: 'Quản lý tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(menu).toHaveCount(0);
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).filter({ visible: true }).click();
    const active = menu.getByRole('link', { name: 'Quản lý tài khoản', exact: true });
    await expect(active).toHaveAttribute('aria-current', 'page');
    await expect
      .poll(() => active.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({ path: `/tmp/angia-clay-menu-active-${theme}-${test.info().project.name}.png` });
  });
}

test('Chuông 3D: rung hữu hạn khi hover/focus, giảm chuyển động tắt animation', async ({ page }) => {
  const state = await householdStartFixture(page);
  state.family = true;
  await page.goto('/?view=profiles');
  const bell = page.getByRole('link', { name: 'Cài đặt thông báo', exact: true }).filter({ visible: true });
  const icon = bell.locator('img');
  await expect(icon).toHaveCSS('width', '30px');
  await expect(icon).toHaveCSS('animation-name', 'none');
  const box = (await bell.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(48);
  expect(box.height).toBeGreaterThanOrEqual(48);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(icon).toHaveCSS('animation-name', 'notification-arrive');
  await expect(icon).toHaveCSS('animation-iteration-count', '1');
  await bell.hover();
  await expect(icon).toHaveCSS('animation-name', 'notification-ring');
  await expect(icon).toHaveCSS('animation-iteration-count', '2');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await bell.focus();
  await expect(icon).toHaveCSS('animation-name', 'notification-ring');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(icon).toHaveCSS('animation-name', 'none');
  await expect(icon).toHaveCSS('transform', 'none');
  await bell.click();
  await expect(page).toHaveURL(/\/notifications$/);
});

async function expectMenuCopy(menu: Locator) {
  for (const description of [
    'Thành viên & thông tin nhà',
    'Thuốc & sức khoẻ của bạn',
    'Email, mật khẩu & dữ liệu',
    'Thoát khỏi thiết bị này',
  ]) {
    await expect(menu.getByText(description, { exact: true })).toBeVisible();
  }
  const profile = menu.getByRole('link', { name: 'Hồ sơ của tôi', exact: true });
  await expect(profile.locator('strong')).toHaveCSS('font-weight', '600');
  await expect(profile.locator('small')).toHaveCSS('font-weight', '500');
}
