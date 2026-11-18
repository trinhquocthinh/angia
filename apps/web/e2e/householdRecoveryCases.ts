import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export function householdRecoveryCases() {
  test('TC-767: API tạo xong nhưng tải phiên lỗi thì chỉ thử GET lại', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.failRefresh = true;
    await page.goto('/waiting?step=create');
    await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Lan');
    await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Chưa thể tải thông tin nhà');
    state.failRefresh = false;
    await page.getByRole('button', { name: 'Thử tải lại thông tin nhà' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(state.writes).toHaveLength(1);
  });
  for (const [code, message] of [
    ['ERR_REGISTRATION_CLOSED', 'Hiện chưa mở đăng ký. Bạn cần lời mời để tham gia.'],
    ['NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ])
    test(`TC-769: lỗi ${code} giữ tên, không vào nhà`, async ({ page }) => {
      const state = await householdStartFixture(page);
      state.code = code!;
      await page.goto('/waiting?step=create');
      await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Lan');
      await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(message!);
      await expect(page.getByLabel('Tên nhà', { exact: true })).toHaveValue('Nhà Lan');
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    });
  test('TC-768: tab khác đã tạo nhà thì tải lại phiên và vào nhà', async ({ page }) => {
    const state = await householdStartFixture(page);
    Object.assign(state, { code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY', status: 409 });
    await page.goto('/waiting?step=create');
    await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Lan');
    await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(state.writes).toHaveLength(1);
  });
}
