import { expect, test } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';
import { fillRegistration } from './accountChecks.js';

export function householdCreationCases() {
  test('TC-767: tạo tài khoản mới → tạo nhà → thấy điều hướng', async ({ page }) => {
    const state = await householdStartFixture(page);
    state.signedIn = false;
    await page.goto('/register');
    await fillRegistration(page);
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bắt đầu', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    expect(state.readsBeforeFamily).toEqual([]);
    await page.getByRole('link', { name: /Tạo nhà mới/ }).click();
    await expect(page).toHaveURL(/\/waiting\?step=create$/);
    await expect(page.getByLabel('Tên nhà', { exact: true })).toHaveValue('');
    await page.getByLabel('Tên nhà', { exact: true }).fill(' Nhà Lan ');
    await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible();
    expect(state.writes).toEqual([{ body: { name: 'Nhà Lan' }, csrf: 'csrf' }]);
  });
  test('TC-767: tên rỗng, tải lại và quay lại không tạo nhà', async ({ page }) => {
    const state = await householdStartFixture(page);
    await page.goto('/waiting?step=create');
    await page.getByLabel('Tên nhà', { exact: true }).fill('   ');
    await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập tên nhà.');
    expect(state.writes).toHaveLength(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Tạo nhà mới', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bắt đầu', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tôi có mã mời/ })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test('TC-771: đang gửi khóa form và chỉ tạo một lần', async ({ page }) => {
    const state = await householdStartFixture(page);
    let release!: () => void;
    state.hold = new Promise((resolve) => {
      release = resolve;
    });
    await page.goto('/waiting?step=create');
    await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Lan');
    await page.getByRole('button', { name: 'Tạo nhà', exact: true }).dblclick();
    await expect(page.getByRole('button', { name: 'Đang tạo nhà…' })).toBeDisabled();
    await expect(page.getByLabel('Tên nhà', { exact: true })).toBeDisabled();
    expect(state.writes).toHaveLength(1);
    release();
    await expect(page).toHaveURL(/\/$/);
  });
}
