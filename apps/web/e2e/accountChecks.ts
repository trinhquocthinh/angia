import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
// Field dùng chung thêm " *" (aria-hidden) vào nhãn ô bắt buộc.
export function byLabel(page: Page, text: string) {
  return page.getByLabel(new RegExp(`^${text.replace(/[()]/g, '\\$&')}( \\*)?$`));
}
export async function fillLogin(page: Page) {
  await byLabel(page, 'Tên đăng nhập').fill('me.lan');
  await byLabel(page, 'Mật khẩu').fill('matkhau123');
}
export async function fillRegistration(page: Page, age = true) {
  await fillLogin(page);
  await page.getByLabel('Tên của bạn').fill('Lan');
  await page.getByLabel('Tôi trên 18 tuổi').setChecked(age);
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
}
export async function checkAccountLayout(page: Page) {
  const smallText = await page.locator('main').evaluate((main) =>
    Array.from(main.querySelectorAll('*'))
      .filter(
        (element) =>
          element.getClientRects().length &&
          Array.from(element.childNodes).some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          ) &&
          parseFloat(getComputedStyle(element).fontSize) <
            (document.documentElement.dataset.textSize === 'large' ? 16 : 14),
      )
      .map((element) => element.textContent),
  );
  expect(smallText).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const brand = page.getByText('AN GIA', { exact: true });
  expect(
    await brand.evaluate((element) => ({
      size: getComputedStyle(element).fontSize,
      weight: getComputedStyle(element).fontWeight,
      font: getComputedStyle(element).fontFamily,
    })),
  ).toMatchObject({ size: '24px', weight: '600', font: expect.stringContaining('Be Vietnam Pro') });
}
export async function accountScreenshot(page: Page, info: TestInfo, name: string, theme: string) {
  const directory = process.env['ACCOUNT_SCREENSHOT_DIR'];
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${info.project.name}-${theme}-${name}.png`),
    fullPage: true,
  });
}
export async function checkAlertBelowButton(page: Page, message: string) {
  const alert = page.getByRole('alert');
  await expect(alert).toHaveText(message);
  const button = await page.locator('button[type=submit]').boundingBox();
  const error = await alert.boundingBox();
  expect(error!.y).toBeGreaterThanOrEqual(button!.y + button!.height);
}
