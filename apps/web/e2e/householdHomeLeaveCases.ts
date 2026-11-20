import { checkHomeDialogSafety } from './householdHomeDialogSafety.js';
import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

function setNonOwner(state: Awaited<ReturnType<typeof householdHomeFixture>>) {
  state.membersState.members = [
    { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
    { accountId: 'account', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: true },
  ];
}

export const householdHomeLeaveCases = [
  () => {
    test('SPEC-067: modal rời nhà focus Huỷ, Escape đóng và trả focus; rời nhà giữ hồ sơ về /waiting', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setNonOwner(state);
      await page.goto('/family/home');

      const trigger = page.getByRole('button', { name: 'Rời nhà', exact: true });
      await checkHomeDialogSafety(page, trigger);
      const dialog = page.getByRole('dialog');
      expect(state.leaveBodies).toHaveLength(0);

      await trigger.click();
      await dialog.getByRole('button', { name: 'Rời nhà', exact: true }).click();
      await expect(page).toHaveURL(/\/waiting$/);
      expect(state.leaveBodies).toEqual([{ ownProfileDisposition: 'keep' }]);
      expect(state.mutationCsrf).toEqual(['csrf']);
    });
  },
  () => {
    test('SPEC-067: chọn xoá hồ sơ cá nhân bắt buộc tick xác nhận trước khi rời nhà', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setNonOwner(state);
      await page.goto('/family/home');

      await page.getByRole('button', { name: 'Rời nhà', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: /Xoá hồ sơ của tôi/ }).check();
      const submit = dialog.getByRole('button', { name: 'Rời nhà', exact: true });
      await expect(submit).toBeDisabled();

      await dialog.getByRole('checkbox').check();
      await expect(submit).toBeEnabled();
      await submit.click();
      await expect(page).toHaveURL(/\/waiting$/);
      expect(state.leaveBodies).toEqual([{ ownProfileDisposition: 'delete' }]);
    });
  },
  () => {
    test('SPEC-067: xử lý lỗi 409 ERR_OWNER_MUST_TRANSFER, ERR_OWNER_MUST_DELETE_FAMILY và ERR_LAST_GUARDIAN', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setNonOwner(state);
      await page.goto('/family/home');

      await page.getByRole('button', { name: 'Rời nhà', exact: true }).click();
      const dialog = page.getByRole('dialog');
      const submit = dialog.getByRole('button', { name: 'Rời nhà', exact: true });

      state.leaveError = 'ERR_OWNER_MUST_TRANSFER';
      await submit.click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.',
      );

      state.leaveError = 'ERR_OWNER_MUST_DELETE_FAMILY';
      await submit.click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.',
      );

      state.leaveError = 'ERR_LAST_GUARDIAN';
      await submit.click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác hoặc xoá hồ sơ trước.',
      );
      await expect(dialog.getByRole('link', { name: 'Xem danh sách hồ sơ' })).toBeVisible();
    });
  },
];
