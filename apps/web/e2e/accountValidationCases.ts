import { expect, test } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { byLabel, fillRegistration } from './accountChecks.js';

export function accountValidationCases(theme: string) {
  for (const [field, label] of [
    ['username', 'Tên đăng nhập'],
    ['password', 'Mật khẩu'],
    ['displayName', 'Tên của bạn'],
    ['email', 'Email (không bắt buộc)'],
    ['ageConfirmed', 'Tôi trên 18 tuổi'],
  ]) {
    test(`lỗi định dạng ${field}, focus đúng ô — ${theme}`, async ({ page }) => {
      const state = await accountFixture(page);
      Object.assign(state, { code: 'ERR_VALIDATION', status: 422, details: { field } });
      await page.goto('/register');
      await fillRegistration(page, false);
      await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
      const input = byLabel(page, label!);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toBeFocused();
      await expect(page.getByRole('alert')).toHaveText('Dữ liệu gửi lên không đúng định dạng quy định.');
      expect(state.bodies[0]!['ageConfirmed']).toBe(false);
    });
  }
}
