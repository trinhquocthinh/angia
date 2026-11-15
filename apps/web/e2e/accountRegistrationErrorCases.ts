import { test } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { fillRegistration, checkAlertBelowButton } from './accountChecks.js';
export function accountRegistrationErrorCases(theme: string) {
  for (const [tc, status, code, message] of [
    ['TC-846', 429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
    [
      'TC-907',
      503,
      'ERR_AUTH_UNAVAILABLE',
      'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.',
    ],
    ['', 0, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ] as const) {
    test(`${tc}: đăng ký lỗi ${code} dưới nút — ${theme}`, async ({ page }) => {
      const state = await accountFixture(page);
      Object.assign(state, { code, status });
      await page.goto('/register');
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
      await checkAlertBelowButton(page, message);
    });
  }
}
