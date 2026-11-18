import { expect, test } from '@playwright/test';
import { accountSecurityFixture } from './accountSecurityFixture.js';

export function accountLegalUpdateStateCases(theme: string) {
  test(`điều khoản: loading theo request thật và đăng xuất — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/me/legal-acceptances', async (route) => {
      await hold;
      await route.fallback();
    });
    await page.goto('/account/legal-update');
    await page.getByRole('button', { name: 'Đồng ý và tiếp tục' }).click();
    await expect(page.getByRole('button', { name: 'Đang gửi…' })).toBeDisabled();
    release();
    await expect(page).toHaveURL(/\/$/);
    state.legalRequired = true;
    await page.goto('/account/legal-update');
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(state.writes.at(-1)?.path).toBe('/api/auth/logout');
  });
  test(`điều khoản: thiếu văn bản thì chặn đồng ý, vẫn cho đăng xuất — ${theme}`, async ({ page }) => {
    await accountSecurityFixture(page);
    await page.route('**/api/legal/current', (route) =>
      route.fulfill({
        status: 503,
        json: { error: { code: 'ERR_AUTH_UNAVAILABLE' } },
      }),
    );
    await page.goto('/account/legal-update');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đồng ý và tiếp tục' })).toBeDisabled();
    await expect(page.locator('.legal-update-document')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeEnabled();
  });
}
