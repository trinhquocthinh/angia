import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { accountScreenshot, byLabel, checkAccountLayout, checkAlertBelowButton } from './accountChecks.js';

const endpoint = '**/api/auth/password-resets';
const invalidMessage = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
const successMessage = 'Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.';

export function accountResetPasswordCases(theme: string) {
  accountResetPasswordHappy(theme);
  accountResetPasswordInvalid(theme);
  accountResetPasswordErrors(theme);
  accountResetPasswordRestrictedSession(theme);
}

function accountResetPasswordHappy(theme: string) {
  test(`TC-764: đặt lại mật khẩu, xoá token khỏi URL, focus và aria-live — ${theme}`, async ({
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
    await page.goto('/reset-password#token=valid-reset-token');
    await expect(page).toHaveURL(/\/reset-password$/);
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới', exact: true })).toBeVisible();
    // Xoá token khỏi URL không được làm hỏng View Transition đang chạy (L2 nghiệm thu E30).
    expect(pageErrors).toEqual([]);
    await expect(page.getByText('Nhập mật khẩu mới cho tài khoản của bạn.', { exact: true })).toBeVisible();
    await expect(byLabel(page, 'Mật khẩu mới')).toBeFocused();
    await checkAccountLayout(page);
    await checkPasswordValidation(page);
    expect(state.bodies).toEqual([]);
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('MatKhauMoi123!');
    await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('button', { name: 'Đang đặt mật khẩu…' })).toBeDisabled();
    release();
    const heading = page.getByRole('heading', { name: 'Đã đặt lại mật khẩu', exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('status')).toHaveText(successMessage);
    await expect(page.locator('form')).toHaveCount(0);
    expect(state.bodies).toEqual([{ token: 'valid-reset-token', newPassword: 'MatKhauMoi123!' }]);
    await accountScreenshot(page, info, 'reset-password-success', theme);
    const login = page.getByRole('link', { name: 'Đăng nhập', exact: true });
    // WebKit không đưa liên kết vào thứ tự Tab mặc định.
    await login.focus();
    await expect(login).toBeFocused();
    await login.click();
    await expect(page).toHaveURL(/\/login$/);
  });
}

async function checkPasswordValidation(page: Page) {
  const password = byLabel(page, 'Mật khẩu mới');
  const confirm = byLabel(page, 'Nhập lại mật khẩu mới');
  const submit = page.getByRole('button', { name: 'Đặt mật khẩu', exact: true });
  await password.fill('ngan');
  await confirm.fill('ngan');
  await submit.click();
  await expect(page.getByText('Mật khẩu cần ít nhất 8 ký tự.', { exact: true })).toBeVisible();
  await expect(password).toBeFocused();
  await password.fill('MatKhauMoi123!');
  await expect(page.getByRole('meter', { name: 'Độ mạnh mật khẩu' })).toHaveAttribute('aria-valuenow', '4');
  await confirm.fill('KhongKhop123!');
  await submit.click();
  await expect(page.getByText('Hai mật khẩu chưa khớp.', { exact: true })).toBeVisible();
  await expect(confirm).toBeFocused();
}

function accountResetPasswordInvalid(theme: string) {
  test(`TC-765: thiếu token và token hết hạn 400 dẫn về quên mật khẩu — ${theme}`, async ({ page }, info) => {
    const state = await accountFixture(page);
    await page.route(endpoint, async (route) => {
      state.bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 400,
        json: { error: { code: 'ERR_RESET_TOKEN_INVALID', message: 'Nội bộ' } },
      });
    });
    await page.goto('/reset-password');
    const missingHeading = page.getByRole('heading', { name: 'Liên kết không dùng được', exact: true });
    await expect(missingHeading).toBeVisible();
    await expect(missingHeading).toBeFocused();
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('status')).toHaveText(invalidMessage);
    await expect(page.locator('form')).toHaveCount(0);
    expect(state.bodies).toEqual([]);
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'reset-password-invalid', theme);
    await page.getByRole('link', { name: 'Yêu cầu liên kết mới', exact: true }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.goto('/reset-password#token=expired-token');
    await expect(page).toHaveURL(/\/reset-password$/);
    await byLabel(page, 'Mật khẩu mới').fill('MatKhauMoi123!');
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('MatKhauMoi123!');
    await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
    const expiredHeading = page.getByRole('heading', { name: 'Liên kết không dùng được', exact: true });
    await expect(expiredHeading).toBeVisible();
    await expect(expiredHeading).toBeFocused();
    await expect(page.getByRole('status')).toHaveText(invalidMessage);
    await page.getByRole('link', { name: 'Yêu cầu liên kết mới', exact: true }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
}

function accountResetPasswordErrors(theme: string) {
  const errors = [
    [422, 'ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
    [429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
    [503, 'ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
    [0, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ] as const;
  for (const [status, code, message] of errors) {
    test(`đặt lại mật khẩu: ${code} — ${theme}`, async ({ page }, info) => {
      await accountFixture(page);
      await page.route(endpoint, (route) => {
        if (!status) return route.abort();
        return route.fulfill({
          status,
          json: {
            error: { code, message: 'Không hiển thị nội bộ', details: { field: 'newPassword' } },
          },
        });
      });
      await page.goto('/reset-password#token=valid-token');
      await byLabel(page, 'Mật khẩu mới').fill('MatKhauMoi123!');
      await byLabel(page, 'Nhập lại mật khẩu mới').fill('MatKhauMoi123!');
      await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
      await checkAlertBelowButton(page, message);
      await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới', exact: true })).toBeVisible();
      await checkAccountLayout(page);
      if (status === 422) await accountScreenshot(page, info, 'reset-password-422', theme);
    });
  }
}

function accountResetPasswordRestrictedSession(theme: string) {
  test(`TC-764: phiên hạn chế truy cập đặt lại mật khẩu công khai — ${theme}`, async ({ page }) => {
    await accountFixture(page);
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 403,
        json: { error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED', message: 'Phiên hạn chế' } },
      }),
    );
    await page.route(endpoint, (route) => route.fulfill({ status: 204 }));
    await page.goto('/reset-password#token=valid-token');
    await expect(page).toHaveURL(/\/reset-password$/);
    await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới', exact: true })).toBeVisible();
    await byLabel(page, 'Mật khẩu mới').fill('MatKhauMoi123!');
    await byLabel(page, 'Nhập lại mật khẩu mới').fill('MatKhauMoi123!');
    await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đã đặt lại mật khẩu', exact: true })).toBeVisible();
  });
}
