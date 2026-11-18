import { expect, test } from '@playwright/test';
import { accountSecurityFixture } from './accountSecurityFixture.js';
import { accountScreenshot, checkAccountLayout } from './accountChecks.js';

export function accountLegalUpdateDesignCases(theme: string) {
  test(`điều khoản: bố cục, liên kết và ambient theo thiết kế — ${theme}`, async ({ page }, info) => {
    await accountSecurityFixture(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/account/legal-update');
    await expect(page.getByRole('button', { name: 'Đồng ý và tiếp tục' })).toBeEnabled();
    await expect(page.getByRole('region')).toHaveAttribute('aria-labelledby', 'legal-update-title');
    for (const link of await page.locator('.legal-update-document').all()) {
      await expect(link.locator('.legal-update-document-title')).toHaveCSS(
        'text-decoration-line',
        'underline',
      );
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await checkAccountLayout(page);
    const durations = await page
      .locator('.legal-update-ambient span')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationDuration));
    expect(durations).toEqual(page.viewportSize()!.width >= 640 ? ['18s', '22s', '20s'] : ['0s', '0s', '0s']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() =>
        page
          .locator('.legal-update-ambient span')
          .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName)),
      )
      .toEqual(['none', 'none', 'none']);
    await accountScreenshot(page, info, 'legal-update', theme);
  });
}
