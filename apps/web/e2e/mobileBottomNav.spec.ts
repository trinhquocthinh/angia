import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E30-S1-T1 — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });

    test('main: bốn mục, chọn đúng hai màn ở / và vào được tải ảnh từ Giấy tờ', async ({ page }) => {
      const state = await householdStartFixture(page);
      state.family = true;
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).filter({ visible: true });
      await expect(nav.getByRole('link')).toHaveText(['Hôm nay', 'Hồ sơ', 'Giấy tờ', 'Nhà']);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Hôm nay');
      await nav.getByRole('link', { name: 'Hồ sơ', exact: true }).click();
      await expect(page).toHaveURL(/\?view=profiles$/);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Hồ sơ');
      await nav.getByRole('link', { name: 'Hôm nay', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Hôm nay');
      await nav.getByRole('link', { name: 'Giấy tờ', exact: true }).click();
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Giấy tờ');
      await page.getByRole('link', { name: 'Chụp / chọn ảnh', exact: true }).click();
      await expect(page).toHaveURL(/\/upload$/);
      await page.getByRole('button', { name: 'Tôi đã hiểu', exact: true }).click();
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Giấy tờ');
      await nav.getByRole('link', { name: 'Nhà', exact: true }).click();
      await expect(page).toHaveURL(/\/family\/home$/);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Nhà');
    });

    for (const linked of [false, true]) {
      test(`member ${linked ? 'đã' : 'chưa'} liên kết: ba mục, không đọc hàng chờ`, async ({ page }) => {
        const state = await householdStartFixture(page);
        Object.assign(state, { family: true, role: 'member', linked });
        const queueReads: string[] = [];
        page.on('request', (request) => {
          if (/source-documents|review-queue/.test(request.url())) queueReads.push(request.url());
        });
        await page.goto('/');
        const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).filter({ visible: true });
        await expect(nav.getByRole('link')).toHaveText(['Hôm nay', 'Hồ sơ của tôi', 'Nhà']);
        await nav.getByRole('link', { name: 'Hồ sơ của tôi', exact: true }).click();
        await expect(page).toHaveURL(/\/my-profile$/);
        await expect(nav.locator('[aria-current="page"]')).toHaveText('Hồ sơ của tôi');
        await expect(nav.getByRole('link', { name: 'Giấy tờ' })).toHaveCount(0);
        expect(queueReads).toEqual([]);
      });
    }

    test('chưa có nhà và trang quản trị không có điều hướng gia đình', async ({ page }) => {
      const state = await householdStartFixture(page);
      await page.goto('/waiting');
      await expect(page.getByText('Tạo nhà mới', { exact: true })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
      Object.assign(state, { family: true, admin: true });
      await page.goto('/admin');
      await expect(
        page.getByRole('button', { name: 'Tài khoản', exact: true }).filter({ visible: true }),
      ).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    });
  });
}

for (const width of [360, 768, 1024, 1440]) {
  test(`E30-S1-T1: ${width}px, chữ 200% không tràn hoặc che footer`, async ({ page }) => {
    const state = await householdStartFixture(page);
    state.family = true;
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).filter({ visible: true });
    await expect(nav.getByRole('link')).toHaveCount(4);
    if (width === 768) expect((await nav.boundingBox())!.width).toBe(88);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.evaluate(() => document.fonts.ready);
    for (const control of await nav.getByRole('link').all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    const footer = (await page.locator('.profile-footer-links').boundingBox())!;
    const dock = (await nav.boundingBox())!;
    if (width < 768) expect(footer.y + footer.height).toBeLessThanOrEqual(dock.y);
  });
}
