import { expect, test } from '@playwright/test';
import { householdMembersSafetyCases } from './householdMembersSafetyCases.js';
import { householdMembersFixture } from './householdMembersFixture.js';

export const householdMembersCases = [
  ...householdMembersSafetyCases,
  () => {
    test('SPEC-066: gỡ thành viên thành công — xác nhận, hiện toast và danh sách bớt 1', async ({ page }) => {
      const state = await householdMembersFixture(page);
      await page.goto('/family/members');
      await expect(page.getByRole('heading', { name: 'Thành viên trong nhà', exact: true })).toBeVisible();
      await expect(page.getByText('Nhà Ngọc Lan · 4 thành viên')).toBeVisible();

      await page.getByRole('link', { name: /Mẹ Hoa/ }).click();
      await expect(page.getByRole('heading', { name: 'Mẹ Hoa', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Mẹ Hoa không còn xem được dữ liệu của nhà.');
      await expect(dialog).toContainText('tải được hồ sơ của mình trong 7 ngày.');
      await dialog.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();

      await expect(page).toHaveURL(/\/family\/members$/);
      await expect(page.getByRole('status')).toContainText('Đã gỡ Mẹ Hoa khỏi nhà');
      await expect(page.getByText('Nhà Ngọc Lan · 3 thành viên')).toBeVisible();
      await expect(page.getByText('Mẹ Hoa')).toHaveCount(0);
      expect(state.patches).toEqual([
        { path: '/api/family/members/member-hoa', body: { action: 'remove' }, csrf: 'csrf' },
      ]);
    });
  },
  () => {
    test('SPEC-066: hàng Chủ hộ và chính mình không có thao tác; URL chi tiết Chủ hộ không có nút', async ({
      page,
    }) => {
      await householdMembersFixture(page);
      await page.goto('/family/members');

      const ownerItem = page.locator('li.household-member-item', { hasText: 'Ba Minh' });
      await expect(ownerItem).toContainText('Chủ hộ');
      await expect(ownerItem.locator('a, button')).toHaveCount(0);

      const selfItem = page.locator('li.household-member-item', { hasText: 'Lan' });
      await expect(selfItem).toContainText('Bạn');
      await expect(selfItem.locator('a, button')).toHaveCount(0);

      await page.goto('/family/members/owner-1');
      await expect(page.getByText('Chủ hộ được bảo vệ')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Gỡ khỏi nhà' })).toHaveCount(0);
      await expect(
        page.locator('.household-member-protected').getByRole('link', {
          name: 'Quay lại danh sách thành viên',
          exact: true,
        }),
      ).toBeVisible();
    });
  },
  () => {
    test('SPEC-066: đổi vai trò thành viên và quay về danh sách kèm toast', async ({ page }) => {
      const state = await householdMembersFixture(page);
      await page.goto('/family/members/member-hoa');

      const saveBtn = page.getByRole('button', { name: 'Lưu thay đổi', exact: true });
      await expect(saveBtn).toBeDisabled();

      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      await expect(page).toHaveURL(/\/family\/members$/);
      await expect(page.getByRole('status')).toContainText('Đã đổi vai trò');
      const hoaRow = page.locator('li.household-member-item', { hasText: 'Mẹ Hoa' });
      await expect(hoaRow).toContainText('Đồng quản lý');
      expect(state.patches).toEqual([
        {
          path: '/api/family/members/member-hoa',
          body: { action: 'change_role', role: 'main' },
          csrf: 'csrf',
        },
      ]);
    });
  },
  () => {
    test('SPEC-066: lỗi ERR_LAST_GUARDIAN hiện đúng thông báo khi đổi vai trò hoặc gỡ', async ({ page }) => {
      const state = await householdMembersFixture(page);
      state.patchError = 'ERR_LAST_GUARDIAN';
      state.patchStatus = 409;

      await page.goto('/family/members/main-tuan');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();

      await expect(page.getByRole('alert')).toContainText(
        'Anh Tuấn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
      );
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
    });
  },
  () => {
    test('SPEC-066: người xem là member chỉ thấy danh sách, không thấy nút mời hay mũi tên thao tác', async ({
      page,
    }) => {
      const state = await householdMembersFixture(page);
      state.household.role = 'member';
      state.members = state.members.map((item) =>
        item.accountId === 'account' ? { ...item, role: 'member' } : item,
      );

      await page.goto('/family/members');
      await expect(page.getByRole('heading', { name: 'Thành viên trong nhà', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /Mời người thân/ })).toHaveCount(0);
      await expect(page.locator('ul.household-members-list a')).toHaveCount(0);
      await expect(page.locator('ul.household-members-list button')).toHaveCount(0);
    });
  },
];
