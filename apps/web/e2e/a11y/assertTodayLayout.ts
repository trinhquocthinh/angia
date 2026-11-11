import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function assertTodayLayout(page: Page) {
  const main = page.getByRole('main');
  for (const control of await main.locator('button:visible, a:visible').all()) {
    const size = await control.boundingBox();
    expect(size?.width, await control.evaluate((element) => element.outerHTML)).toBeGreaterThanOrEqual(48);
    expect(size?.height, await control.evaluate((element) => element.outerHTML)).toBeGreaterThanOrEqual(48);
  }
  const smallText = await main
    .locator('*')
    .evaluateAll((elements) =>
      elements
        .filter(
          (element) =>
            Array.from(element.childNodes).some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
            ) &&
            element.getClientRects().length > 0 &&
            parseFloat(getComputedStyle(element).fontSize) < 16,
        )
        .map((element) => element.textContent),
    );
  expect(smallText).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
