import { expect, test } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { accountScreenshot, checkAccountLayout } from './accountChecks.js';

const endpoint = '**/api/auth/email-verifications/confirm';

export function accountVerifyEmailCases(theme: string) {
  accountVerifyEmailHappy(theme);
  accountVerifyEmailInvalid(theme);
  accountVerifyEmailTaken(theme);
  accountVerifyEmailErrors(theme);
  accountVerifyEmailRestrictedSession(theme);
}

function accountVerifyEmailHappy(theme: string) {
  test(`TC-925: xác minh email thành công, xoá hash, gọi API 1 lần, focus và aria-live — ${theme}`, async ({
    page,
  }, info) => {
    const state = await accountFixture(page);
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(endpoint, async (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()['content-type']).toContain('application/json');
      state.bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      await hold;
      await route.fulfill({ status: 204 });
    });
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/verify-email#token=valid-verify-token');
    await expect(page).toHaveURL(/\/verify-email$/);
    expect(await page.evaluate(() => location.hash)).toBe('');
    // Tiêu đề trạng thái chờ mang role="status" nên không phải role heading.
    const pendingHeading = page.getByRole('status').filter({ hasText: 'Đang xác minh email của bạn…' });
    await expect(pendingHeading).toBeVisible();
    // Xoá token khỏi URL không được làm hỏng View Transition đang chạy (L2 nghiệm thu E30).
    expect(pageErrors).toEqual([]);
    await expect(pendingHeading).toBeFocused();
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'verify-email-pending', theme);
    release();

    const heading = page.getByRole('heading', { name: 'Đã xác minh email', exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('status')).toHaveText(
      'Email của bạn đã được xác minh. Bạn có thể dùng email này để đăng nhập và đặt lại mật khẩu.',
    );
    expect(state.bodies).toEqual([{ token: 'valid-verify-token' }]);
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'verify-email-success', theme);

    const enter = page.getByRole('link', { name: 'Vào AN GIA', exact: true });
    await expect(enter).toHaveAttribute('href', '/');
    // WebKit không đưa liên kết vào thứ tự Tab mặc định.
    await enter.focus();
    await expect(enter).toBeFocused();
  });
}

function accountVerifyEmailInvalid(theme: string) {
  test(`TC-926: thiếu token và token hết hạn 400 hiển thị trạng thái link hỏng — ${theme}`, async ({
    page,
  }, info) => {
    const state = await accountFixture(page);
    await page.route(endpoint, async (route) => {
      state.bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 400,
        json: { error: { code: 'ERR_VERIFICATION_TOKEN_INVALID', message: 'Nội bộ' } },
      });
    });

    await page.goto('/verify-email');
    const missingHeading = page.getByRole('heading', { name: 'Liên kết không dùng được', exact: true });
    await expect(missingHeading).toBeVisible();
    await expect(missingHeading).toBeFocused();
    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toContainText('Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
    await expect(status).toContainText('Hãy mở Tài khoản và bấm “Xác minh email” để nhận liên kết mới.');
    expect(state.bodies).toEqual([]);
    const accountLink = page.getByRole('link', { name: 'Mở Tài khoản', exact: true });
    await expect(accountLink).toHaveAttribute('href', '/account');
    await accountLink.focus();
    await expect(accountLink).toBeFocused();
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'verify-email-invalid', theme);

    // Link thật luôn mở bằng điều hướng mới; đổi hash trong cùng tài liệu không nạp lại trang.
    await page.goto('about:blank');
    await page.goto('/verify-email#token=expired-verify-token');
    await expect(page).toHaveURL(/\/verify-email$/);
    const expiredHeading = page.getByRole('heading', { name: 'Liên kết không dùng được', exact: true });
    await expect(expiredHeading).toBeVisible();
    await expect(expiredHeading).toBeFocused();
    await expect(page.getByRole('status')).toContainText('Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
    expect(state.bodies).toEqual([{ token: 'expired-verify-token' }]);
  });
}

function accountVerifyEmailTaken(theme: string) {
  test(`TC-931: 409 ERR_EMAIL_TAKEN hiển thị trạng thái email trùng — ${theme}`, async ({ page }, info) => {
    await accountFixture(page);
    await page.route(endpoint, (route) =>
      route.fulfill({
        status: 409,
        json: { error: { code: 'ERR_EMAIL_TAKEN', message: 'Nội bộ' } },
      }),
    );
    await page.goto('/verify-email#token=taken-verify-token');
    await expect(page).toHaveURL(/\/verify-email$/);
    const heading = page.getByRole('heading', { name: 'Không xác minh được', exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toContainText('Email này đã được một tài khoản khác xác minh.');
    await expect(status).toContainText('Hãy dùng một email khác trong Tài khoản.');
    const accountLink = page.getByRole('link', { name: 'Mở Tài khoản', exact: true });
    await expect(accountLink).toHaveAttribute('href', '/account');
    await accountLink.focus();
    await expect(accountLink).toBeFocused();
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'verify-email-taken', theme);
  });
}

function accountVerifyEmailErrors(theme: string) {
  const errors = [
    [429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
    [503, 'ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
    [0, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ] as const;
  for (const [status, code, message] of errors) {
    test(`xác minh email lỗi tạm thời ${code} cho thử lại — ${theme}`, async ({ page }) => {
      await accountFixture(page);
      let calls = 0;
      await page.route(endpoint, (route) => {
        calls += 1;
        if (calls > 1) return route.fulfill({ status: 204 });
        if (!status) return route.abort();
        return route.fulfill({
          status,
          json: { error: { code, message: 'Nội bộ' } },
        });
      });
      await page.goto('/verify-email#token=retry-verify-token');
      const heading = page.getByRole('heading', { name: 'Không xác minh được', exact: true });
      await expect(heading).toBeVisible();
      await expect(heading).toBeFocused();
      await expect(page.getByRole('alert')).toHaveText(message);
      await checkAccountLayout(page);
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Đã xác minh email', exact: true })).toBeVisible();
      expect(calls).toBe(2);
    });
  }
}

function accountVerifyEmailRestrictedSession(theme: string) {
  for (const [status, code] of [
    [403, 'ERR_PASSWORD_CHANGE_REQUIRED'],
    [403, 'ERR_LEGAL_ACCEPTANCE_REQUIRED'],
    [503, 'ERR_AUTH_UNAVAILABLE'],
  ] as const) {
    test(`TC-925: xác minh công khai không phụ thuộc API phiên ${code} — ${theme}`, async ({ page }) => {
      await accountFixture(page);
      await page.route('**/api/me', (route) => {
        return route.fulfill({ status, json: { error: { code, message: 'Phiên không khả dụng' } } });
      });
      await page.route(endpoint, (route) => route.fulfill({ status: 204 }));
      await page.goto('/verify-email#token=restricted-session-token');
      await expect(page).toHaveURL(/\/verify-email$/);
      await expect(page.getByRole('heading', { name: 'Đã xác minh email', exact: true })).toBeVisible();
    });
  }
}
