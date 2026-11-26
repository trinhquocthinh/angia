import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { reminderFixture } from './reminderFixture.js';
import { REMINDER_ID, REMINDER_PROFILE_ID } from './reminderUiSeed.js';

export function reminderLayoutCases() {
  for (const width of [360, 768, 1024, 1440]) {
    test(`SPEC-081 — Nhắc thuốc ${width}px dùng được ở hai nền và hai cỡ chữ`, async ({ page }, info) => {
      test.setTimeout(120_000);
      const state = await reminderFixture(page);
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark']) {
        for (const large of [false, true]) {
          await page.addInitScript(
            ({ theme, large }) => {
              localStorage.setItem('angia-theme', theme);
              localStorage.setItem('angia-large-text', String(large));
            },
            { theme, large },
          );
          const paths = [
            `/profiles/${REMINDER_PROFILE_ID}/reminders`,
            `/reminders/${REMINDER_ID}`,
            `/revisit-reminders/${REMINDER_ID}`,
          ];
          for (const [index, path] of paths.entries()) {
            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(
              page.getByText(/Đang tải khung giờ nhắc|Đang tải lời nhắc|Đang tải người nhận nhắc/),
            ).toHaveCount(0);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const buttons = page.locator('main').last().locator('button:visible');
            for (const button of await buttons.all()) {
              expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(large ? 56 : 46);
            }
            if (width === 360 && large) {
              const results = await new AxeBuilder({ page }).include('main main').analyze();
              expect(
                results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
              ).toEqual([]);
            }
            if (theme === 'light' && !large)
              await page.screenshot({
                path: info.outputPath(`reminder-${width}-${index}.png`),
                fullPage: true,
              });
          }
        }
      }
      state.profile.displayName =
        'Tên hồ sơ mẫu rất dài cần xuống dòng khi người dùng phóng chữ trên thiết bị di động';
      await page.addInitScript(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await page.goto(`/profiles/${REMINDER_PROFILE_ID}/reminders`);
      await expect(page.getByRole('heading', { name: 'Khung giờ nhắc', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
