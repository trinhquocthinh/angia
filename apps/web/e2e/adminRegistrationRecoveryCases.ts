import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export function adminRegistrationRecoveryCases() {
  pendingSwitchCase();
  clipboardFailureCase();
  invitationFailureCase();
  registrationReadFailureCase();
}

function pendingSwitchCase() {
  test('TC-833: đang lưu khoá Huỷ/Escape; lỗi mạng giữ công tắc và cho thử lại', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/admin/registration-switch', async (route) => {
      await hold;
      await route.fulfill({ status: 503, json: { error: { code: 'ERR_INTERNAL' } } });
    });
    await page.goto('/admin');
    const toggle = page.getByRole('switch');
    await toggle.focus();
    await toggle.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    try {
      await expect(dialog).toHaveAttribute('aria-busy', 'true');
      await expect(dialog.getByRole('button', { name: 'Huỷ' })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
    } finally {
      release();
    }
    await expect(dialog.getByRole('alert')).toHaveText('Không lưu được. Thử lại sau.');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await page.unroute('**/api/admin/registration-switch');
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(toggle).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  });
}

function clipboardFailureCase() {
  test('SPEC-065: clipboard lỗi không làm mất mã hay link', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('Không cho phép sao chép');
          },
        },
      });
    });
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Lời mời lập nhà', exact: true });
    await card.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true }).click();
    await expect(card.getByText('AN-REAL-1', { exact: true })).toBeVisible();
    for (const name of ['Sao chép link', 'Sao chép mã']) {
      await card.getByRole('button', { name }).click();
      await expect(card.getByRole('status')).toContainText('Không sao chép được.');
      await expect(card.getByText('AN-REAL-1', { exact: true })).toBeVisible();
      await expect(card.getByLabel('Link lời mời lập nhà')).toHaveValue('https://angia.test/invite#secret-1');
    }
  });
}

function invitationFailureCase() {
  test('SPEC-065: lỗi tạo/thu hồi giữ state an toàn, ERR_NOT_FOUND xoá lời mời', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Lời mời lập nhà', exact: true });
    state.registrationError = 'ERR_FORBIDDEN';
    await card.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true }).click();
    await expect(card.getByRole('alert')).toHaveText('Không tạo được lời mời. Thử lại sau.');
    await expect(card.getByLabel('Link lời mời lập nhà')).toHaveCount(0);
    state.registrationError = '';
    await card.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true }).click();
    await expect(card.getByText('AN-REAL-1', { exact: true })).toBeVisible();
    const revoke = card.getByRole('button', { name: 'Thu hồi', exact: true });
    await revoke.focus();
    await revoke.press('Enter');
    state.registrationError = 'ERR_FORBIDDEN';
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Không thu hồi được lời mời. Thử lại sau.');
    await expect(card.getByText('AN-REAL-1', { exact: true })).toBeVisible();
    state.registrationError = 'ERR_NOT_FOUND';
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card.getByRole('status')).toHaveText('Lời mời này không còn hiệu lực.');
    await expect(card.getByText('AN-REAL-1', { exact: true })).toHaveCount(0);
  });
}

function registrationReadFailureCase() {
  test('TC-832: tải công tắc lỗi có Thử lại, không hiện công tắc giả', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    state.registrationReadError = true;
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Mở đăng ký công khai', exact: true });
    await expect(card.getByRole('alert')).toHaveText('Không tải được trạng thái đăng ký.');
    await expect(card.getByRole('switch')).toHaveCount(0);
    state.registrationReadError = false;
    await card.getByRole('button', { name: 'Thử lại' }).click();
    await expect(card.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
}
