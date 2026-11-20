import { expect, type Locator, type Page } from '@playwright/test';

/** Native modal có thể đưa Tab lên chrome trình duyệt; chỉ cấm focus vào nền. */
export async function checkHomeDialogSafety(page: Page, trigger: Locator) {
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('[data-autofocus]')).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(() =>
        [document.documentElement, document.body].every((el) => getComputedStyle(el).overflow === 'hidden'),
      ),
    )
    .toBe(true);
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(key);
      expect(
        await dialog.evaluate(
          (el) => document.activeElement === document.body || el.contains(document.activeElement),
        ),
      ).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow))
    .not.toBe('hidden');
}
