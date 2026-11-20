import { expect, test } from '@playwright/test';
import {
  ACC_LAN,
  ACC_MINH,
  ADULT_PROFILE_ID,
  MINOR_PROFILE_ID,
  profileGuardiansFixture,
} from './profileGuardiansFixture.js';

export const profileGuardiansCases = [
  () =>
    test('TC-816 — thêm người giám hộ, tự gỡ thành công và cập nhật giao diện theo vai trò mới', async ({
      page,
    }) => {
      const state = await profileGuardiansFixture(page);
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);

      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toBeVisible();
      await expect(page.getByText('1/2 người')).toBeVisible();
      await expect(page.getByText('Người nhận nhắc')).toHaveCount(0);

      await page.getByRole('button', { name: 'Thêm người giám hộ' }).click();
      const addDialog = page.getByRole('dialog');
      await expect(addDialog).toBeVisible();
      await expect(addDialog.getByText('Cô Hoa')).toHaveCount(0);

      await addDialog.getByLabel('Ba Minh · Chủ hộ').check();
      await addDialog.getByRole('button', { name: 'Thêm', exact: true }).click();

      expect(state.addPosts).toEqual([{ body: { guardianAccountId: ACC_MINH }, csrf: 'csrf' }]);
      await expect(page.getByText('Đã thêm người giám hộ')).toBeVisible();
      await expect(page.getByText('2/2 Đã đủ')).toBeVisible();
      await expect(page.getByText('Đã đủ 2 người giám hộ.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thêm người giám hộ' })).toHaveCount(0);

      await page.getByRole('button', { name: 'Tự gỡ' }).click();
      const removeDialog = page.getByRole('dialog');
      await expect(removeDialog.getByText('Bạn không còn là người giám hộ của Bé An?')).toBeVisible();
      await removeDialog.getByRole('button', { name: 'Tự gỡ', exact: true }).click();

      expect(state.removeDeletes).toEqual([{ csrf: 'csrf' }]);
      await expect(page.getByText('Đã tự gỡ')).toBeVisible();
      await expect(page.getByRole('region', { name: 'Người giám hộ', exact: true })).toBeFocused();
      await expect(page.getByRole('button', { name: 'Tự gỡ' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Thêm người giám hộ' })).toHaveCount(0);
    }),

  () =>
    test('TC-816 — tự gỡ khi còn 1 giám hộ hiển thị lỗi ERR_LAST_GUARDIAN tiếng Việt', async ({ page }) => {
      await profileGuardiansFixture(page);
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);

      await page.getByRole('button', { name: 'Tự gỡ' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Tự gỡ', exact: true }).click();

      await expect(
        dialog.getByText('Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ.'),
      ).toBeVisible();
    }),

  () =>
    test('TC-816 — hồ sơ người lớn không hiển thị mục Người giám hộ ở tab giám hộ lẫn trang Nhắc thuốc', async ({
      page,
    }) => {
      await profileGuardiansFixture(page);
      await page.goto(`/profiles/${ADULT_PROFILE_ID}/guardians`);

      await expect(page.getByText('Hồ sơ này không cần người giám hộ.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Người giám hộ' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toHaveCount(0);

      await page.goto(`/profiles/${ADULT_PROFILE_ID}/reminders`);
      await expect(page.getByRole('heading', { name: 'Người nhận nhắc' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toHaveCount(0);
    }),

  () =>
    test('TC-816 — người xem không phải giám hộ chỉ thấy danh sách, không có nút thao tác', async ({
      page,
    }) => {
      const state = await profileGuardiansFixture(page);
      state.guardians = [{ accountId: ACC_MINH, displayName: 'Ba Minh', isMe: false }];
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);

      await expect(page.getByText('Ba Minh')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thêm người giám hộ' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tự gỡ' })).toHaveCount(0);
    }),

  () =>
    test('TC-816 — hộp thoại quản lý focus và đóng khi nhấn Escape', async ({ page }) => {
      const state = await profileGuardiansFixture(page);
      state.guardians = [{ accountId: ACC_LAN, displayName: 'Mẹ Lan', isMe: true }];
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);

      const openBtn = page.getByRole('button', { name: 'Thêm người giám hộ' });
      await openBtn.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await expect(dialog.getByRole('button', { name: 'Huỷ' })).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(openBtn).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      const remove = page.getByRole('button', { name: 'Tự gỡ' });
      await remove.click();
      await expect(dialog.getByRole('button', { name: 'Huỷ' })).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(remove).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    }),

  () =>
    test('TC-816 — hồ sơ trẻ chưa đồng ý lưu dữ liệu vẫn thấy thẻ Người giám hộ', async ({ page }) => {
      const state = await profileGuardiansFixture(page);
      state.consentStatus = 'pending';
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/guardians`);

      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toBeVisible();
      await expect(page.getByText('1/2 người')).toBeVisible();
      await expect(page.getByText('Hồ sơ chưa được đồng ý lưu dữ liệu.')).toHaveCount(0);
    }),

  () =>
    test('TC-816 — tab Người giám hộ hiện đúng điều kiện và bấm tab điều hướng đúng', async ({ page }) => {
      await profileGuardiansFixture(page);
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/medications`);

      const tab = page.getByRole('link', { name: 'Người giám hộ' });
      await expect(tab).toBeVisible();
      await tab.click();

      await expect(page).toHaveURL(new RegExp(`/profiles/${MINOR_PROFILE_ID}/guardians$`));
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toBeVisible();

      await page.goto(`/profiles/${ADULT_PROFILE_ID}/medications`);
      await expect(page.getByRole('link', { name: 'Người giám hộ' })).toHaveCount(0);
    }),

  () =>
    test('TC-816 — trang Nhắc thuốc của hồ sơ trẻ có giải thích và liên kết sang tab Người giám hộ', async ({
      page,
    }) => {
      await profileGuardiansFixture(page);
      await page.goto(`/profiles/${MINOR_PROFILE_ID}/reminders`);

      await expect(page.getByText('Người nhận nhắc của hồ sơ trẻ là các người giám hộ.')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toHaveCount(0);

      await page.getByRole('link', { name: 'Xem người giám hộ' }).click();
      await expect(page).toHaveURL(new RegExp(`/profiles/${MINOR_PROFILE_ID}/guardians$`));
      await expect(page.getByRole('heading', { name: 'Người giám hộ' })).toBeVisible();
    }),
];
