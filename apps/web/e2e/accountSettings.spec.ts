import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountScreenshot, byLabel } from './accountChecks.js';
import { accountSettingsFixture } from './accountSettingsFixture.js';

const ownerNotice = 'Bạn chưa xác minh email. Nếu quên mật khẩu, bạn sẽ không lấy lại được tài khoản.';
const memberNotice =
  'Bạn chưa xác minh email nên chưa dùng được Quên mật khẩu. Nếu quên mật khẩu, hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại.';
const sentNotice = 'Đã gửi liên kết xác minh. Liên kết có hiệu lực 24 giờ.';

export function accountSettingsCases(theme: string) {
  accountSettingsMenuAndNoticesCase(theme);
  accountSettingsEmailChangeCase(theme);
  accountSettingsVerificationOutcomesCase(theme);
  accountSettingsThemeAndPlaceholdersCase(theme);
}

async function checkNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

function accountSettingsMenuAndNoticesCase(theme: string) {
  test(`Tài khoản: mở từ menu và phân biệt 2 dòng nhắc Chủ hộ và Đồng quản lý — ${theme}`, async ({
    page,
  }, info) => {
    await accountSettingsFixture(page, {
      family: { id: 'fam-1', name: 'Nhà Ngọc Lan', isOwner: false },
      role: 'main',
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
    const manageLink = dialog.getByRole('link', { name: 'Quản lý tài khoản', exact: true });
    await expect(manageLink).toHaveAttribute('href', '/account');
    await manageLink.click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('heading', { name: 'Tài khoản', exact: true })).toBeVisible();
    await expect(page.getByText('Đồng quản lý', { exact: true })).toBeVisible();
    await expect(page.getByText(memberNotice, { exact: true })).toBeVisible();
    await checkNoOverflow(page);
    await accountScreenshot(page, info, 'account-settings-manager', theme);

    await accountSettingsFixture(page, {
      family: { id: 'fam-1', name: 'Nhà An', isOwner: true },
      role: 'main',
    });
    await page.goto('/account');
    await expect(page.getByText('Chủ hộ', { exact: true })).toBeVisible();
    await expect(page.getByText(ownerNotice, { exact: true })).toBeVisible();
    await checkNoOverflow(page);
  });
}

function accountSettingsEmailChangeCase(theme: string) {
  test(`TC-927/TC-928/TC-932: thêm/đổi email gọi PATCH đúng body, lỗi mật khẩu và pendingEmail — ${theme}`, async ({
    page,
  }) => {
    const state = await accountSettingsFixture(page, {
      emailStatus: { email: null, emailVerified: false, pendingEmail: null },
    });
    await page.goto('/account');
    await expect(page.getByText('Chưa có email', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Thêm email', exact: true }).click();
    // Form tự focus ô email ở khung hình kế; đợi xong mới nhập để focus không bị giật giữa chừng.
    await expect(byLabel(page, 'Email mới')).toBeFocused();
    const emailInput = byLabel(page, 'Email mới');
    const passwordInput = byLabel(page, 'Mật khẩu hiện tại');
    await expect(emailInput).toBeFocused();

    state.patchStatus = 401;
    state.patchCode = 'ERR_INVALID_CREDENTIALS';
    await emailInput.fill('lan@example.com');
    await passwordInput.fill('saimatkhau');
    await page.getByRole('button', { name: 'Lưu email', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu chưa đúng.');

    state.patchCode = '';
    state.patchStatus = 200;
    await passwordInput.fill('matkhau123');
    await page.getByRole('button', { name: 'Lưu email', exact: true }).click();
    await expect(page.getByText('lan@example.com', { exact: true })).toBeVisible();
    await expect(page.getByText('Chưa xác minh', { exact: true })).toBeVisible();
    expect(state.patchCalls.at(-1)).toEqual({
      body: { email: 'lan@example.com', currentPassword: 'matkhau123' },
      csrf: 'csrf-settings',
    });
    expect(state.verifyCalls).toEqual([]);

    state.emailStatus = { email: 'old@example.com', emailVerified: true, pendingEmail: null };
    await page.goto('/account');
    await expect(page.getByText('Đã xác minh', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xác minh email', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Đổi email', exact: true }).click();
    // Form tự focus ô email ở khung hình kế; đợi xong mới nhập để focus không bị giật giữa chừng.
    await expect(byLabel(page, 'Email mới')).toBeFocused();
    await byLabel(page, 'Email mới').fill('new@example.com');
    await byLabel(page, 'Mật khẩu hiện tại').fill('matkhau123');
    await page.getByRole('button', { name: 'Lưu email', exact: true }).click();
    await expect(
      page.getByText(
        'Email mới đang chờ xác minh: new@example.com. Cho tới khi đó, email cũ vẫn dùng để đặt lại mật khẩu.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xác minh email', exact: true })).toBeVisible();
  });
}

function accountSettingsVerificationOutcomesCase(theme: string) {
  test(`TC-925/TC-930/TC-931: bấm Xác minh email xử lý 202, 409, 429 và 204 làm mới phiên — ${theme}`, async ({
    page,
  }) => {
    const state = await accountSettingsFixture(page, {
      emailStatus: { email: 'lan@example.com', emailVerified: false, pendingEmail: null },
    });
    await page.goto('/account');
    const verifyBtn = page.getByRole('button', { name: 'Xác minh email', exact: true });

    await verifyBtn.click();
    const status = page.getByRole('status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveText(sentNotice);
    expect(state.verifyCalls).toEqual([{ csrf: 'csrf-settings' }]);

    state.verifyStatus = 409;
    state.verifyCode = 'ERR_EMAIL_TAKEN';
    await verifyBtn.click();
    await expect(page.getByRole('alert')).toHaveText('Email này đã được một tài khoản khác xác minh.');

    state.verifyStatus = 429;
    state.verifyCode = 'ERR_RATE_LIMITED';
    await verifyBtn.click();
    await expect(page.getByRole('alert')).toHaveText('Bạn thao tác quá nhanh, vui lòng thử lại sau.');

    state.verifyCode = '';
    state.verifyStatus = 204;
    await verifyBtn.click();
    await expect(page.getByText('Đã xác minh', { exact: true })).toBeVisible();
    await expect(verifyBtn).toHaveCount(0);
    await expect(page.getByText(memberNotice, { exact: true })).toHaveCount(0);
  });
}

function accountSettingsThemeAndPlaceholdersCase(theme: string) {
  test(`Tài khoản: mật khẩu theo hasLocalCredential, nền giao diện thật, tải dữ liệu và xoá tài khoản — ${theme}`, async ({
    page,
  }) => {
    await accountSettingsFixture(page, {
      hasLocalCredential: true,
      emailStatus: { email: 'lan@example.com', emailVerified: true, pendingEmail: null },
    });
    await page.goto('/account');
    // WebKit không đưa liên kết vào thứ tự Tab mặc định; kiểm focus bằng focus().
    const passwordLink = page.getByRole('link', { name: 'Đổi mật khẩu', exact: true });
    await expect(passwordLink).toHaveAttribute('href', '/account/change-password');
    await passwordLink.focus();
    await expect(passwordLink).toBeFocused();

    await page.getByRole('radio', { name: 'Tối', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('angia-theme'))).toBe('dark');
    await page.getByRole('radio', { name: 'Sáng', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const dataSection = page.getByRole('region', { name: 'Dữ liệu của tôi' });
    const deleteSection = page.getByRole('region', { name: 'Xoá tài khoản' });
    await expect(dataSection.getByRole('button', { name: 'Tải dữ liệu của tôi', exact: true })).toBeVisible();
    await expect(deleteSection.getByRole('button', { name: 'Xoá tài khoản…', exact: true })).toBeVisible();

    await accountSettingsFixture(page, { hasLocalCredential: false, family: null, role: null });
    await page.goto('/account');
    await expect(
      page.getByRole('region', { name: 'Thông tin tài khoản' }).getByText('Chưa có nhà', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đổi mật khẩu', exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Xoá tài khoản' })).toHaveCount(0);
    await checkNoOverflow(page);
  });
}
