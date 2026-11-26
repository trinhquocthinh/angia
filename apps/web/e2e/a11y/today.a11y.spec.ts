import { expect, test } from '@playwright/test';
import { todayFixture } from '../todayFixture.js';
import { assertLayout } from './assertLayout.js';
import { assertAccessibility } from './assertAccessibility.js';

for (const theme of ['light', 'dark']) {
  for (const role of ['main', 'member'] as const) {
    test(`TC-876: Hôm nay không có lỗi serious/critical, cỡ chữ và vùng chạm đạt ở 360 px — ${role}/${theme}`, async ({
      page,
    }, testInfo) => {
      await todayFixture(page, role);
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Liều hôm nay', exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('article')).toHaveCount(2);
      await assertAccessibility(page, testInfo, 'before');
      await assertLayout(page);
      const buttons = page.getByRole('button', { name: 'Đã dùng', exact: true });
      for (const button of await buttons.all()) {
        const size = await button.evaluate((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          font: parseFloat(getComputedStyle(element).fontSize),
        }));
        expect(size.width).toBeGreaterThanOrEqual(46);
        expect(size.height).toBeGreaterThanOrEqual(46);
        expect(size.font).toBeGreaterThanOrEqual(14);
      }
      await buttons.first().click();
      await expect(page.getByText('Đã dùng · Mẹ · 07:32', { exact: true })).toBeVisible();
      await assertAccessibility(page, testInfo, 'confirmed');
      await assertLayout(page);
    });
  }
}
