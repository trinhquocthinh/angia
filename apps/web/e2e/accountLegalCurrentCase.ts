import { expect, test } from '@playwright/test';
import { accountFixture, currentLegal } from './accountFixture.js';
import { byLabel, fillRegistration, checkAlertBelowButton } from './accountChecks.js';
export function accountLegalCurrentCase(theme: string) {
  test(`TC-742: dùng details.current hợp lệ, không GET lại — ${theme}`, async ({ page }) => {
    const state = await accountFixture(page);
    const current = {
      ...currentLegal,
      privacy: {
        ...currentLegal.privacy,
        id: '44444444-4444-4444-8444-444444444444',
        url: '/legal/privacy-v2.md',
      },
    };
    Object.assign(state, { code: 'ERR_LEGAL_VERSION_OUTDATED', status: 409, details: { current } });
    await page.goto('/register');
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await checkAlertBelowButton(page, 'Điều khoản vừa được cập nhật, vui lòng đọc lại.');
    await expect(page.getByRole('checkbox', { name: /Tôi đồng ý/ })).not.toBeChecked();
    await expect(page.getByRole('link', { name: 'Chính sách quyền riêng tư', exact: true })).toHaveAttribute(
      'href',
      current.privacy.url,
    );
    expect(state.legalReads).toBe(1);
    state.code = '';
    await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
    await byLabel(page, 'Email (không bắt buộc)').fill('lan@email.com');
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/\/waiting$/);
    expect(state.bodies[1]!['legalAcceptance']).toMatchObject({ privacyVersionId: current.privacy.id });
    expect(state.bodies[1]!['email']).toBe('lan@email.com');
  });
}
