import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

export async function assertTodayAccessibility(page: Page, testInfo: TestInfo, state: string) {
  await page.evaluate(() => document.fonts.ready);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await testInfo.attach(`axe-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual([]);
}
