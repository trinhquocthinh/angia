import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { householdStartFixture } from './householdStartFixture.js';

for (const theme of ['light', 'dark']) {
  test.describe(`Thanh đáy Stitch — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });

    registerIconCase(theme);
    registerMotionCase();
    registerLayoutCase();
    registerMainLayoutCase();
  });
}

function registerMainLayoutCase() {
  test('ba mục quản lý không tràn hoặc che footer khi chữ 200%', async ({ page }, info) => {
    test.skip(info.project.name.includes('desktop'));
    const state = await householdStartFixture(page);
    state.family = true;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const nav = page.locator('.mobile-bottom-nav');
    for (const control of await nav.locator('a, button').all()) {
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(361);
    }
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(async () => {
        await page.evaluate(() =>
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
        );
        const footer = await page.locator('.profile-footer-links').boundingBox();
        const dock = await nav.boundingBox();
        return footer!.y + footer!.height - dock!.y;
      })
      .toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

function registerIconCase(theme: string) {
  test('chỉ có icon 3D, không có bộ chuyển kiểu và Thêm mới mở tải giấy tờ', async ({ page }, info) => {
    const state = await householdStartFixture(page);
    state.family = true;
    await page.goto('/');
    const nav = page.locator('.mobile-bottom-nav');
    if (info.project.name.includes('desktop')) {
      await expect(nav).toBeHidden();
      return;
    }
    await expect(nav).toBeVisible();
    const home = nav.getByRole('link', { name: 'Trang chủ', exact: true });
    await expect(home).toHaveAttribute('aria-current', 'page');
    const image = home.locator('img');
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0))
      .toBe(true);
    await expect(nav.locator('.mobile-nav-icon-3d').first()).toHaveCSS('opacity', '1');
    await expect(nav.locator('.mobile-nav-icon-2d')).toHaveCount(0);
    await expect(nav.getByRole('button')).toHaveCount(0);
    await expect(nav.getByRole('group', { name: 'Kiểu icon điều hướng' })).toHaveCount(0);
    await mkdir('/tmp/angia-mobile-bottom-nav-stitch/screenshots', { recursive: true });
    await page.screenshot({
      path: `/tmp/angia-mobile-bottom-nav-stitch/screenshots/${info.project.name}-${theme}.png`,
    });
    await nav.getByRole('link', { name: 'Thêm mới', exact: true }).click();
    await expect(page).toHaveURL(/\/upload$/);
    await expect(page.getByText('Tạo mới mục chăm sóc', { exact: true })).toHaveCount(0);
  });
}

function registerMotionCase() {
  test('đổi tab, badge thật và thông số chuyển động/reduced motion', async ({ page }, info) => {
    test.skip(info.project.name.includes('desktop'));
    const state = await householdStartFixture(page);
    state.family = true;
    await page.goto('/');
    const nav = page.locator('.mobile-bottom-nav');
    const pending = nav.getByRole('link', { name: 'Chờ duyệt', exact: true });
    await expect(nav.locator('.mobile-nav-badge')).toHaveCount(0);
    await pending.click();
    await expect(page).toHaveURL(/\/review\/?$/);
    await expect(pending).toHaveAttribute('aria-current', 'page');
    await expect(pending).toHaveCSS('animation-name', 'none');
    await expect(nav.locator('.mobile-nav-icon').last()).toHaveCSS('animation-name', 'none');
    await expect(nav.locator('.mobile-nav-fab')).toHaveCSS('transition-duration', '0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(nav.locator('.mobile-nav-fab')).toHaveCSS('transition-duration', '0.2s, 0.2s, 0.2s');
    await expect(nav.locator('.mobile-nav-icon').last()).toHaveCSS('animation-name', 'mobile-nav-bounce');
    await expect
      .poll(() =>
        nav.locator('.mobile-nav-add').evaluate((element) => {
          const css = getComputedStyle(element, '::before');
          return { name: css.animationName, duration: css.animationDuration };
        }),
      )
      .toEqual({ name: 'mobile-nav-breathe', duration: '2s' });
  });
}

function registerLayoutCase() {
  test('360px/chữ 200%, vùng chạm và quyền thành viên', async ({ page }, info) => {
    test.skip(info.project.name.includes('desktop'));
    const state = await householdStartFixture(page);
    Object.assign(state, { family: true, role: 'member', linked: true });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    const nav = page.locator('.mobile-bottom-nav');
    await expect(nav.getByRole('link', { name: 'Hồ sơ của tôi', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Thêm mới|Chờ duyệt/ })).toHaveCount(0);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const control of await nav.locator('a, button').all()) {
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(361);
    }
  });
}
