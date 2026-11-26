import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

export async function assertAccessibility(page: Page, testInfo: TestInfo, state: string) {
  await page.evaluate(() => document.fonts.ready);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
    .catch(async (error: unknown) => {
      const message = String(error);
      await testInfo.attach(`axe-error-${state}`, { body: message, contentType: 'text/plain' });
      console.log(`[a11y] ${state} serious/critical=unknown rules=SCAN_ERROR`);
      expect.soft(message, 'Không thể chạy axe; không được coi là màn đạt').toBe('');
      return null;
    });
  if (!result) return;
  await testInfo.attach(`axe-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  const violations = result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  console.log(
    `[a11y] ${new URL(page.url()).pathname} theme=${await page.locator('html').getAttribute('data-theme')} state=${state} serious/critical=${violations.length} rules=${violations.map(({ id }) => id).join(',') || 'none'}`,
  );
  expect.soft(violations).toEqual([]);
}
