import { accountValidationCases } from './accountValidationCases.js';
import { accountRegistrationErrorCases } from './accountRegistrationErrorCases.js';
import { accountLegalCurrentCase } from './accountLegalCurrentCase.js';
import { expect, test } from '@playwright/test';
import { accountFixture, currentLegal } from './accountFixture.js';
import {
  byLabel,
  fillLogin,
  fillRegistration,
  checkAccountLayout,
  accountScreenshot,
  checkAlertBelowButton,
} from './accountChecks.js';

test.beforeEach(async ({ page }, info) => {
  const theme = info.title.endsWith('— dark') ? 'dark' : 'light';
  await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
});

for (const theme of ['light', 'dark']) {
  accountValidationCases(theme);
  accountRegistrationErrorCases(theme);
  accountLegalCurrentCase(theme);

  test(`TC-744: đăng nhập đúng, trạng thái chờ, điều hướng và liên kết — ${theme}`, async ({
    page,
  }, info) => {
    const state = await accountFixture(page);
    let release!: () => void;
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'login-empty', theme);
    await expect(page.getByRole('link', { name: 'Đăng nhập quản trị' })).toHaveAttribute(
      'href',
      '/api/auth/login',
    );
    await expect(page.getByRole('link', { name: 'Quên mật khẩu' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    await expect(page.getByText(/Authentik|Đăng nhập an toàn/)).toHaveCount(0);
    await fillLogin(page);
    const toggle = page.getByRole('button', { name: 'Hiện mật khẩu' });
    await toggle.click();
    await expect(byLabel(page, 'Mật khẩu')).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
    await expect(byLabel(page, 'Mật khẩu')).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('button', { name: 'Đang đăng nhập…' })).toBeDisabled();
    await expect(byLabel(page, 'Tên đăng nhập')).toBeDisabled();
    await expect(byLabel(page, 'Mật khẩu')).toBeDisabled();
    release();
    await expect(page).toHaveURL(/\/waiting$/);
    expect(state.bodies).toEqual([{ username: 'me.lan', password: 'matkhau123' }]);
    expect(state.meReads).toBeGreaterThan(1);
  });
  const errors = [
    ['TC-745/746', 401, 'ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
    ['TC-747', 403, 'ERR_ACCOUNT_LOCKED', 'Tài khoản đang bị khoá. Liên hệ quản trị.'],
    ['', 403, 'ERR_FORBIDDEN', 'Không thể kết nối. Vui lòng thử lại.'],
    ['TC-845', 429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
    [
      'TC-907',
      503,
      'ERR_AUTH_UNAVAILABLE',
      'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.',
    ],
    ['', 0, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
    ['', 503, 'MALFORMED', 'Không thể kết nối. Vui lòng thử lại.'],
  ] as const;
  for (const [tc, status, code, message] of errors) {
    test(`${tc}: đăng nhập ${code} — ${theme}`, async ({ page }, info) => {
      const state = await accountFixture(page);
      Object.assign(state, { code, status });
      await page.goto('/login');
      await fillLogin(page);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await checkAlertBelowButton(page, message);
      await checkAccountLayout(page);
      await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
      await expect(byLabel(page, 'Tên đăng nhập')).toBeEnabled();
      if (code === 'ERR_INVALID_CREDENTIALS') await accountScreenshot(page, info, 'login-error', theme);
    });
  }
  test(`TC-736: tạo tài khoản không email, chờ và điều hướng — ${theme}`, async ({ page }, info) => {
    const state = await accountFixture(page);
    let release!: () => void;
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await page.goto('/register');
    await expect(page.getByRole('checkbox', { name: /Tôi đồng ý/ })).not.toBeChecked();
    await expect(page.getByLabel('Tôi trên 18 tuổi')).not.toBeChecked();
    await expect(page.getByRole('link', { name: 'Điều khoản sử dụng', exact: true })).toHaveAttribute(
      'href',
      currentLegal.terms.url,
    );
    await expect(page.getByRole('link', { name: 'Chính sách quyền riêng tư', exact: true })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'register-empty', theme);
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('button', { name: 'Đang tạo tài khoản…' })).toBeDisabled();
    for (const input of await page.locator('form input').all()) await expect(input).toBeDisabled();
    release();
    await expect(page).toHaveURL(/\/waiting$/);
    expect(state.bodies).toEqual([
      {
        username: 'me.lan',
        password: 'matkhau123',
        displayName: 'Lan',
        ageConfirmed: true,
        legalAcceptance: {
          termsVersionId: currentLegal.terms.id,
          privacyVersionId: currentLegal.privacy.id,
        },
      },
    ]);
  });
  test(`TC-737: tên trùng chỉ lỗi ô tên, có focus — ${theme}`, async ({ page }, info) => {
    const state = await accountFixture(page);
    Object.assign(state, { code: 'ERR_USERNAME_TAKEN', status: 409 });
    await page.goto('/register');
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const username = byLabel(page, 'Tên đăng nhập');
    await expect(username).toHaveAttribute('aria-invalid', 'true');
    await expect(username).toBeFocused();
    const description = await username.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${description}"]`)).toHaveText('Tên đăng nhập này đã có người dùng.');
    await expect(byLabel(page, 'Mật khẩu')).not.toHaveAttribute('aria-invalid', 'true');
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'register-username-error', theme);
  });
  test(`TC-740: đăng ký đóng là thông tin không đỏ — ${theme}`, async ({ page }, info) => {
    const state = await accountFixture(page);
    Object.assign(state, { code: 'ERR_REGISTRATION_CLOSED', status: 403 });
    await page.goto('/register');
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const notice = page.getByRole('status');
    await expect(notice).toHaveText('Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.');
    expect(await notice.evaluate((element) => getComputedStyle(element).color)).toBe(
      await page
        .getByRole('heading', { name: 'Tạo tài khoản' })
        .evaluate((element) => getComputedStyle(element).color),
    );
    const heading = await page.getByRole('heading', { name: 'Tạo tài khoản' }).boundingBox();
    const box = await notice.boundingBox();
    const field = await byLabel(page, 'Tên đăng nhập').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    expect(box!.y).toBeLessThan(field!.y);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await checkAccountLayout(page);
    await accountScreenshot(page, info, 'register-closed', theme);
  });
  test(`TC-742: điều khoản cũ bỏ tick, đọc lại và dùng ID mới — ${theme}`, async ({ page }) => {
    const state = await accountFixture(page);
    Object.assign(state, { code: 'ERR_LEGAL_VERSION_OUTDATED', status: 409 });
    await page.goto('/register');
    await fillRegistration(page);
    state.legal = {
      ...currentLegal,
      terms: {
        ...currentLegal.terms,
        id: '33333333-3333-4333-8333-333333333333',
        url: '/legal/terms-v2.md',
      },
    };
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await checkAlertBelowButton(page, 'Điều khoản vừa được cập nhật, vui lòng đọc lại.');
    await expect(page.getByRole('checkbox', { name: /Tôi đồng ý/ })).not.toBeChecked();
    await expect(page.getByRole('link', { name: 'Điều khoản sử dụng', exact: true })).toHaveAttribute(
      'href',
      '/legal/terms-v2.md',
    );
    expect(state.legalReads).toBe(2);
    state.code = '';
    await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page).toHaveURL(/\/waiting$/);
    expect(state.bodies[1]!['legalAcceptance']).toMatchObject({ termsVersionId: state.legal.terms.id });
  });
  test(`không tải được legal thì chặn gửi, không bịa liên kết — ${theme}`, async ({ page }) => {
    const state = await accountFixture(page);
    state.legalFailed = true;
    await page.goto('/register');
    await checkAlertBelowButton(page, 'Không thể kết nối. Vui lòng thử lại.');
    await expect(page.getByRole('button', { name: 'Tạo tài khoản', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Điều khoản sử dụng', exact: true })).toHaveCount(0);
    expect(state.bodies).toEqual([]);
  });
}
