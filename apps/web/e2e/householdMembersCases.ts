import { householdMemberOfferRefreshCases } from './householdMemberOfferRefreshCases.js';
import { householdMemberResizeCases } from './householdMemberResizeCases.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';
import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { householdMemberDetailCases } from './householdMemberDetailCases.js';
import { householdMemberResetPasswordCases } from './householdMemberResetPasswordCases.js';
import { householdMembersSafetyCases } from './householdMembersSafetyCases.js';

export const householdMembersCases = [
  ...householdMemberDetailCases,
  ...householdMemberResetPasswordCases,
  ...householdMemberResizeCases,
  ...householdMemberOfferRefreshCases,
  ...householdMembersSafetyCases,
  () => {
    test('SPEC-066: gỡ thành viên thành công — xác nhận, hiện toast và danh sách bớt 1', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.goto('/family/home');
      await expect(page.getByRole('heading', { name: 'Thành viên & Phân quyền', exact: true })).toBeVisible();
      await expect(page.getByText('4 thành viên · 1 Chủ hộ / 2 Đồng quản lý / 1 Thành viên')).toBeVisible();

      await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
      await expect(page.getByRole('heading', { name: 'Mẹ Hoa', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();

      const dialog = page.getByRole('dialog', { name: /^Gỡ / });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Mẹ Hoa không còn xem được dữ liệu của nhà.');
      await expect(dialog).toContainText('tải được hồ sơ của mình trong 7 ngày.');
      await dialog.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();

      await expect(page).toHaveURL(/\/family\/home$/);
      await expect(page.getByRole('status')).toContainText('Đã gỡ Mẹ Hoa khỏi nhà');
      await expect(page.getByText('3 thành viên · 1 Chủ hộ / 2 Đồng quản lý / 0 Thành viên')).toBeVisible();
      await expect(page.getByText('Mẹ Hoa')).toHaveCount(0);
      expect(state.membersState.patches).toEqual([
        { path: '/api/family/members/member-hoa', body: { action: 'remove' }, csrf: 'csrf' },
      ]);
    });
  },
  () => {
    test('SPEC-066: hàng Chủ hộ và chính mình không chọn được và không có nút thao tác', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.goto('/family/home');

      const ownerItem = page.locator('li.household-member-item', { hasText: 'Ba Minh' });
      await expect(ownerItem).toContainText('Chủ hộ');
      await expect(ownerItem.locator('a, button')).toHaveCount(0);

      const selfItem = page.locator('li.household-member-item', { hasText: 'Lan' });
      await expect(selfItem).toContainText('Bạn');
      await expect(selfItem.locator('a, button')).toHaveCount(0);
    });
  },
  () => {
    test('SPEC-066: đổi vai trò thành viên ngay trên trang kèm toast', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.goto('/family/home');

      await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
      const saveBtn = page.getByRole('button', { name: 'Lưu thay đổi', exact: true });
      await expect(saveBtn).toBeDisabled();

      await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      await expect(page).toHaveURL(/\/family\/home$/);
      await expect(page.getByRole('status')).toContainText('Đã đổi vai trò');
      const hoaRow = page.locator('li.household-member-item', { hasText: 'Mẹ Hoa' });
      await expect(hoaRow).toContainText('Đồng quản lý');
      expect(state.membersState.patches).toEqual([
        {
          path: '/api/family/members/member-hoa',
          body: { action: 'change_role', role: 'main' },
          csrf: 'csrf',
        },
      ]);
    });
  },
  ...(['change_role', 'remove'] as const).map((action) => () => {
    test(`SPEC-066: lỗi ERR_LAST_GUARDIAN hiện đúng thông báo khi ${action}`, async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      state.membersState.patchError = 'ERR_LAST_GUARDIAN';
      state.membersState.patchStatus = 409;

      await page.goto('/family/home');
      await page.getByRole('button', { name: /Anh Tuấn/ }).click();
      if (action === 'change_role') {
        await page.getByRole('radio', { name: /Thành viên/ }).check();
        await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
      } else {
        await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();
        await page
          .getByRole('dialog', { name: /^Gỡ / })
          .getByRole('button', { name: 'Gỡ khỏi nhà', exact: true })
          .click();
      }

      await expect(page.getByRole('alert')).toContainText(
        'Anh Tuấn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
      );
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
      expect(state.membersState.patches).toHaveLength(1);
    });
  }),
  () => {
    test('SPEC-066: người xem là member chỉ thấy danh sách, không thấy nút mời hay nút chọn hàng', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      state.membersState.household.role = 'member';
      state.membersState.members = state.membersState.members.map((item) =>
        item.accountId === 'account' ? { ...item, role: 'member' } : item,
      );

      await page.goto('/family/home');
      await expect(page.getByRole('heading', { name: 'Thành viên & Phân quyền', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /Mời người thân/ })).toHaveCount(0);
      await expect(page.locator('ul.household-members-list a')).toHaveCount(0);
      await expect(page.locator('ul.household-members-list button')).toHaveCount(0);
    });
  },
];
