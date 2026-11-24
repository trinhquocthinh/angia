import { expect, test } from '@playwright/test';
import {
  registerSelfExportCase,
  registerOwnerExportCase,
  registerExportErrorCase,
} from './accountDataExportCases.js';
import { accountDataDeletionFixture } from './accountDataDeletionFixture.js';

function registerDeletionCases() {
  test('TC-827/TC-830: xoá tài khoản có hồ sơ liên kết yêu cầu radio, báo lỗi mật khẩu sai rồi chuyển về /login', async ({
    page,
  }) => {
    const state = await accountDataDeletionFixture(page, {
      healthProfileId: 'prof-me',
      deleteStatus: 401,
      deleteCode: 'ERR_INVALID_CREDENTIALS',
    });
    await page.goto('/account');
    await page.getByRole('button', { name: 'Xoá tài khoản…', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Xoá tài khoản?' });
    const confirmBtn = dialog.getByRole('button', { name: 'Xoá tài khoản', exact: true });
    const passwordInput = dialog.getByLabel('Nhập mật khẩu để xác nhận');

    await expect(dialog.getByRole('radio', { name: /Để lại hồ sơ cho nhà/ })).not.toBeChecked();
    await expect(dialog.getByRole('radio', { name: /Xoá hồ sơ của tôi/ })).not.toBeChecked();
    await expect(confirmBtn).toBeDisabled();

    await passwordInput.fill('saimatkhau');
    await expect(confirmBtn).toBeDisabled();
    await dialog.getByRole('radio', { name: /Xoá hồ sơ của tôi/ }).check();
    await expect(confirmBtn).toBeEnabled();

    await confirmBtn.click();
    await expect(dialog.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu chưa đúng.');
    await expect(passwordInput).toHaveValue('saimatkhau');

    state.deleteStatus = 204;
    state.deleteCode = '';
    await passwordInput.fill('matkhau123');
    await confirmBtn.click();
    await expect(page).toHaveURL(/\/login$/);
    expect(state.deleteCalls.at(-1)).toEqual({
      body: { password: 'matkhau123', ownProfileDisposition: 'delete' },
      csrf: 'csrf-e2e',
    });
  });

  test('TC-829: Chủ hộ xoá tài khoản nhận ERR_OWNER_MUST_TRANSFER ngay trong hộp xác nhận', async ({
    page,
  }) => {
    await accountDataDeletionFixture(page, {
      family: { id: 'fam-1', name: 'Nhà An', isOwner: true },
      deleteStatus: 409,
      deleteCode: 'ERR_OWNER_MUST_TRANSFER',
    });
    await page.goto('/account');
    await page.getByRole('button', { name: 'Xoá tài khoản…', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Xoá tài khoản?' });
    await dialog.getByLabel('Nhập mật khẩu để xác nhận').fill('matkhau123');
    await dialog.getByRole('button', { name: 'Xoá tài khoản', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Hãy trao quyền Chủ hộ cho người khác trước.');
    await expect(dialog.getByRole('button', { name: 'Huỷ', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Đã hiểu' })).toHaveCount(0);
  });
}

function registerDialogFocusCase() {
  test('TC-827: mở bằng bàn phím focus mật khẩu, khoá cuộn, Esc đóng và trả focus', async ({ page }) => {
    await accountDataDeletionFixture(page, { healthProfileId: 'prof-me' });
    await page.goto('/account');
    const trigger = page.getByRole('button', { name: 'Xoá tài khoản…', exact: true });
    const before = await page.evaluate(() => [
      getComputedStyle(document.documentElement).overflow,
      getComputedStyle(document.body).overflow,
    ]);
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Xoá tài khoản?' });
    await expect(dialog.getByLabel('Nhập mật khẩu để xác nhận')).toBeFocused();
    expect(
      await page.evaluate(() => [
        getComputedStyle(document.documentElement).overflow,
        getComputedStyle(document.body).overflow,
      ]),
    ).toEqual(['hidden', 'hidden']);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(() => [
        getComputedStyle(document.documentElement).overflow,
        getComputedStyle(document.body).overflow,
      ]),
    ).toEqual(before);
  });
}

function registerDialogPendingCase() {
  test('TC-827: pending chặn Esc, khoá nút và bấm đúp chỉ gửi một POST', async ({ page }) => {
    let release!: () => void;
    const deleteGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const state = await accountDataDeletionFixture(page, {
      deleteGate,
      deleteStatus: 401,
      deleteCode: 'ERR_INVALID_CREDENTIALS',
    });
    await page.goto('/account');
    const trigger = page.getByRole('button', { name: 'Xoá tài khoản…', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Xoá tài khoản?' });
    const password = dialog.getByLabel('Nhập mật khẩu để xác nhận');
    await password.fill('matkhau-sai');
    const confirm = dialog.getByRole('button', { name: 'Xoá tài khoản', exact: true });
    try {
      // Hai click liên tiếp trong cùng lượt xử lý, trước khi React render pending.
      await confirm.evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
      await expect.poll(() => state.deleteCalls.length).toBe(1);
      await expect(confirm).toBeDisabled();
      await expect(password).toBeDisabled();
      await expect(dialog.getByRole('button', { name: 'Huỷ', exact: true })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
      expect(state.deleteCalls).toEqual([{ body: { password: 'matkhau-sai' }, csrf: 'csrf-e2e' }]);
    } finally {
      release();
    }
    await expect(dialog.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu chưa đúng.');
    await expect(password).toHaveValue('matkhau-sai');
    await dialog.getByRole('button', { name: 'Huỷ', exact: true }).click();
    await expect(trigger).toBeFocused();
  });
}

function registerDialogErrorCases() {
  const errors = [
    [401, 'ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
    [409, 'ERR_OWNER_MUST_TRANSFER', 'Hãy trao quyền Chủ hộ cho người khác trước.'],
    [409, 'ERR_OWNER_MUST_DELETE_FAMILY', 'Bạn là người duy nhất trong nhà. Hãy xoá nhà nếu không dùng nữa.'],
    [
      409,
      'ERR_LAST_GUARDIAN',
      'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Hãy thêm người giám hộ khác trước.',
    ],
    [429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
    [422, 'ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
    [503, 'ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
    [500, 'ERR_UNKNOWN', 'Không thể kết nối. Vui lòng thử lại.'],
  ] as const;
  for (const [deleteStatus, deleteCode, message] of errors) {
    test(`TC-829/TC-830: ${deleteCode} hiện trong hộp và giữ mật khẩu`, async ({ page }) => {
      await accountDataDeletionFixture(page, { deleteStatus, deleteCode });
      await page.goto('/account');
      const trigger = page.getByRole('button', { name: 'Xoá tài khoản…', exact: true });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Xoá tài khoản?' });
      const password = dialog.getByLabel('Nhập mật khẩu để xác nhận');
      await password.fill('matkhau-sai');
      await dialog.getByRole('button', { name: 'Xoá tài khoản', exact: true }).click();
      await expect(dialog.getByRole('alert')).toHaveText(message);
      await expect(password).toHaveValue('matkhau-sai');
      expect(page.url()).not.toContain('matkhau-sai');
      expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('matkhau-sai');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
}

for (const theme of ['light', 'dark']) {
  test.describe(`Tài khoản — Tải dữ liệu và Xoá tài khoản — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    registerSelfExportCase();
    registerOwnerExportCase();
    registerExportErrorCase();
    registerDeletionCases();
    registerDialogFocusCase();
    registerDialogPendingCase();
    registerDialogErrorCases();
  });
}
