import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export function adminRegistrationSwitchCases() {
  registrationSwitchCase();
  registrationForbiddenCase();
}

function registrationSwitchCase() {
  test('TC-832/833: bật tắt qua xác nhận, Huỷ, Escape, trả focus và khoá cuộn', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    await page.goto('/admin');
    const toggle = page.getByRole('switch', { name: 'Cho phép tự đăng ký' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.focus();
    await toggle.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Tắt đăng ký công khai?');
    await expect(dialog.getByRole('button', { name: 'Huỷ' })).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    expect(state.registrationWrites).toHaveLength(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');
    await dialog.getByRole('button', { name: 'Huỷ' }).click();
    expect(state.registrationWrites).toHaveLength(0);
    await toggle.focus();
    await toggle.press('Enter');
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.focus();
    await toggle.press('Enter');
    await expect(dialog).toContainText('Bất kỳ ai cũng có thể tự tạo tài khoản.');
    await dialog.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(state.registrationWrites.map((item) => item.body)).toEqual([{ open: false }, { open: true }]);
    expect(state.registrationWrites.every((item) => item.csrf === 'csrf' && item.method === 'PUT')).toBe(
      true,
    );
  });
}

function registrationForbiddenCase() {
  test('TC-834: lỗi quyền giữ giá trị và làm mới phiên', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    state.registrationError = 'ERR_FORBIDDEN';
    let reads = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/me') reads += 1;
    });
    await page.goto('/admin');
    const toggle = page.getByRole('switch');
    await expect(toggle).toBeVisible();
    const before = reads;
    await toggle.click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Bạn không có quyền thay đổi cài đặt này.');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => reads).toBeGreaterThan(before);
    expect(state.registrationOpen).toBe(true);
  });
}
