import { accountLegalUpdateStateCases } from './accountLegalUpdateStateCases.js';
import { accountLegalUpdateDesignCases } from './accountLegalUpdateDesignCases.js';
import { expect, test } from '@playwright/test';
import { checkAccountLayout } from './accountChecks.js';
import { currentLegal } from './accountFixture.js';
import { accountSecurityFixture } from './accountSecurityFixture.js';

export function accountLegalUpdateCases(theme: string) {
  accountLegalUpdateDesignCases(theme);
  accountLegalUpdateStateCases(theme);
  test(`TC-752/753/755: API 403 chuyển màn đồng ý bản mới rồi tiếp tục — ${theme}`, async ({ page }) => {
    const state = await accountSecurityFixture(page);
    state.legalRequired = true;
    await page.goto('/');
    await expect(page).toHaveURL(/\/account\/legal-update$/);
    await expect(page.getByRole('heading', { name: 'Điều khoản đã thay đổi' })).toBeVisible();
    await checkAccountLayout(page);
    const terms = page.getByRole('link', { name: 'Đọc Điều khoản sử dụng (bản 01/11/2026)' });
    const privacy = page.getByRole('link', { name: 'Đọc Chính sách quyền riêng tư (bản 01/11/2026)' });
    await expect(terms).toHaveAttribute('href', currentLegal.terms.url);
    await expect(privacy).toHaveAttribute('href', currentLegal.privacy.url);
    await expect(terms).toHaveAttribute('target', '_blank');
    await expect(privacy).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.getByText('Tải dữ liệu của tôi')).toHaveCount(0);
    await expect(page.getByText('Xoá tài khoản')).toHaveCount(0);
    await page.getByRole('button', { name: 'Đồng ý và tiếp tục' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(state.writes.at(-1)).toEqual({
      path: '/api/me/legal-acceptances',
      body: { versionIds: [currentLegal.terms.id, currentLegal.privacy.id] },
      csrf: 'csrf',
    });
  });
}
