import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { checkAccountLayout, checkAlertBelowButton, accountScreenshot } from './accountChecks.js';

const sentMessage =
  'Nếu email này thuộc một tài khoản đã xác minh, liên kết đặt lại sẽ được gửi trong ít phút. Liên kết có hiệu lực 30 phút.';
const rateMessage = 'Bạn thao tác quá nhanh, vui lòng thử lại sau.';
const endpoint = '**/api/auth/password-reset-requests';

export function accountForgotPasswordCases(theme: string) {
  test(`TC-762: quên mật khẩu, gửi lại, tab, focus và aria-live — ${theme}`, async ({ page }, info) => {
    const state = await accountFixture(page);
    let release!: () => void;
    let hold: Promise<void> | null = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(endpoint, async (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()['content-type']).toContain('application/json');
      state.bodies.push(route.request().postDataJSON() as Record<string, unknown>);
      if (hold) await hold;
      await route.fulfill({ status: 202, json: { received: true } });
    });
    await page.goto('/login');
    await page.getByRole('link', { name: 'Quên mật khẩu', exact: true }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Quên mật khẩu', exact: true })).toBeVisible();
    await checkAccountLayout(page);
    await expect(page.locator('input')).toHaveCount(1);
    const email = page.getByRole('textbox', { name: 'Email', exact: true });
    const submit = page.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu', exact: true });
    await checkEmailAndKeyboard(page);
    expect(state.bodies).toEqual([]);
    await submit.click();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(email).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Đang gửi…' })).toBeDisabled();
    release();
    hold = null;
    const heading = page.getByRole('heading', { name: 'Kiểm tra hộp thư của bạn' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByText(sentMessage, { exact: true })).toBeVisible();
    await expect(page.getByText('lan@example.com', { exact: false })).toHaveCount(0);
    await expect(page.locator('input')).toHaveCount(0);
    await accountScreenshot(page, info, 'forgot-password-sent', theme);
    await page.keyboard.press('Tab');
    const resend = page.getByRole('button', { name: 'Gửi lại', exact: true });
    await expect(resend).toBeFocused();
    await resend.click();
    await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByRole('status')).toHaveText('Đã gửi lại.');
    expect(state.bodies).toEqual([{ email: 'lan@example.com' }, { email: 'lan@example.com' }]);
    await page.route(endpoint, (route) =>
      route.fulfill({ status: 429, json: { error: { code: 'ERR_RATE_LIMITED', message: 'Nội bộ' } } }),
    );
    await resend.click();
    await checkAlertBelowButton(page, rateMessage);
    await expect(page.getByRole('status')).toBeEmpty();
    await expect(heading).toBeVisible();
    await expect(resend).toBeEnabled();
    await page.getByRole('link', { name: 'Quay lại đăng nhập' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
  accountForgotPasswordErrors(theme);
  accountForgotPasswordRestrictedSession(theme);
}

function accountForgotPasswordErrors(theme: string) {
  const errors = [
    [429, 'ERR_RATE_LIMITED', rateMessage],
    [422, 'ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
    [0, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
    [503, 'MALFORMED', 'Không thể kết nối. Vui lòng thử lại.'],
  ] as const;
  for (const [status, code, message] of errors) {
    test(`quên mật khẩu: ${code} — ${theme}`, async ({ page }, info) => {
      await accountFixture(page);
      await page.route(endpoint, (route) => {
        if (!status) return route.abort();
        if (code === 'MALFORMED')
          return route.fulfill({ status, contentType: 'text/plain', body: 'unavailable' });
        return route.fulfill({ status, json: { error: { code, message: 'Không hiển thị nội bộ' } } });
      });
      await page.goto('/forgot-password');
      const email = page.getByRole('textbox', { name: 'Email', exact: true });
      await email.fill('lan@example.com');
      await page.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu' }).click();
      if (status === 422) {
        await expect(page.getByRole('alert')).toHaveText(message);
        await expect(email).toHaveAttribute('aria-invalid', 'true');
        await expect(email).toBeFocused();
        const description = await email.getAttribute('aria-describedby');
        await expect(page.locator(`[id="${description}"]`)).toHaveText(message);
      } else await checkAlertBelowButton(page, message);
      await expect(page.getByRole('heading', { name: 'Quên mật khẩu', exact: true })).toBeVisible();
      await checkAccountLayout(page);
      await accountScreenshot(page, info, `forgot-password-${code}`, theme);
    });
  }
}

async function checkEmailAndKeyboard(page: Page) {
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  const submit = page.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu', exact: true });
  await submit.click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập email.');
  await email.fill('me.lan');
  await submit.click();
  await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập email đúng định dạng.');
  // Form đưa focus về ô email ở khung hình kế; đợi xong để không giật focus của bước Tab sau.
  await expect(email).toBeFocused();
  await email.fill('lan@example.com');
  const clear = page.getByRole('button', { name: 'Xoá email' });
  // Nút xoá chỉ render sau khi có chữ; đợi nó hiện trước khi Tab để không đua với React.
  await expect(clear).toBeVisible();
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(clear).toBeFocused();
  await clear.click();
  await expect(email).toHaveValue('');
  await expect(email).toBeFocused();
  await email.fill('lan@example.com');
  await expect(clear).toBeVisible();
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  // WebKit mặc định không đưa liên kết vào thứ tự Tab; kiểm focus được liên kết bằng focus().
  const back = page.getByRole('link', { name: 'Quay lại đăng nhập' });
  await back.focus();
  await expect(back).toBeFocused();
}

function accountForgotPasswordRestrictedSession(theme: string) {
  test(`TC-762: phiên hạn chế truy cập quên mật khẩu công khai — ${theme}`, async ({ page }) => {
    await accountFixture(page);
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 403,
        json: { error: { code: 'ERR_PASSWORD_CHANGE_REQUIRED', message: 'Phiên hạn chế' } },
      }),
    );
    await page.route(endpoint, (route) => route.fulfill({ status: 202, json: { received: true } }));
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Quên mật khẩu', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('lan@example.com');
    await page.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu' }).click();
    await expect(page.getByRole('heading', { name: 'Kiểm tra hộp thư của bạn' })).toBeVisible();
  });
}
