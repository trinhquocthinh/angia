import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

for (const theme of ['light', 'dark']) {
  test(`Cỡ chữ ${theme}: mặc định chuẩn, bật/tắt, chuyển màn và tải lại`, async ({ page }) => {
    const state = await householdStartFixture(page);
    state.family = true;
    await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    await page.goto('/account');
    const toggle = page.getByRole('switch', { name: 'Chữ lớn', exact: true });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('body')).toHaveCSS('font-size', '16px');
    const primary = page.getByRole('button', { name: 'Tải dữ liệu của tôi', exact: true });
    await expect(primary).toHaveCSS('font-size', '14px');
    expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(46);
    await expect(page.getByRole('heading', { name: 'Tài khoản', exact: true })).toHaveCSS(
      'font-size',
      '24px',
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(primary).toHaveCSS('font-size', '16px');
    expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    await expect(page.locator('body')).toHaveCSS('font-size', '18px');
    await expect(page.getByRole('heading', { name: 'Tài khoản', exact: true })).toHaveCSS(
      'font-size',
      '26px',
    );
    await page.reload();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => localStorage.getItem('angia-large-text'))).toBe('true');
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).filter({ visible: true });
    await nav.getByRole('link', { name: 'Hôm nay', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Liều hôm nay', exact: true })).toHaveCSS(
      'font-size',
      '26px',
    );
    await page.goto('/account');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.reload();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('body')).toHaveCSS('font-size', '16px');
  });
}

test('Cỡ chữ: storage bị chặn vẫn bật/tắt được trong phiên', async ({ page }) => {
  const state = await householdStartFixture(page);
  state.family = true;
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Bị chặn');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Bị chặn');
    };
  });
  await page.goto('/account');
  const toggle = page.getByRole('switch', { name: 'Chữ lớn', exact: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
  await expect(page.locator('body')).toHaveCSS('font-size', '18px');
  await toggle.click();
  await expect(page.locator('body')).toHaveCSS('font-size', '16px');
});

for (const largeText of [false, true]) {
  for (const width of [360, 768, 1024, 1440]) {
    test(`Cỡ chữ: ${largeText ? 'lớn' : 'chuẩn'} ở ${width}px, phóng chữ 200%`, async ({ page }) => {
      const state = await householdStartFixture(page);
      Object.assign(state, { family: true, role: 'member', linked: false });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('angia-large-text', String(value)), largeText);
      await page.goto('/account');
      const toggle = page.getByRole('switch', { name: 'Chữ lớn', exact: true });
      await expect(toggle).toHaveAttribute('aria-checked', String(largeText));
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await expect(page.locator('body')).toHaveCSS('font-size', largeText ? '36px' : '32px');
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const box = (await toggle.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
      const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).filter({ visible: true });
      for (const link of await nav.getByRole('link').all()) {
        const size = (await link.boundingBox())!;
        expect(size.width).toBeGreaterThanOrEqual(48);
        expect(size.height).toBeGreaterThanOrEqual(48);
      }
    });
  }
}
