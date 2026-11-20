import { checkHomeDialogSafety } from './householdHomeDialogSafety.js';
import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

export const householdHomeDeletionCases = [
  () => {
    test('SPEC-069: người không phải Chủ hộ không thấy khối Xoá nhà và không gọi API deletion-request', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      state.membersState.members = [
        { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
        { accountId: 'account', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: true },
      ];
      await page.goto('/family/home');
      await expect(page.getByRole('heading', { name: 'Nhà của tôi', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Xoá nhà', exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Trao quyền Chủ hộ', exact: true })).toHaveCount(0);
      expect(state.deletionGetCount).toBe(0);
    });
  },
  () => {
    test('SPEC-069: Chủ hộ ở một mình mở modal bằng bàn phím, nhập đúng tên mới bật Xoá nhà, hẹn giờ và thu hồi', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      state.membersState.members = [
        { accountId: 'account', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: true },
      ];
      await page.goto('/family/home');
      await expect(
        page.getByText('Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.'),
      ).toBeVisible();

      const trigger = page.getByRole('button', { name: 'Xoá nhà', exact: true });
      await checkHomeDialogSafety(page, trigger);
      const dialog = page.getByRole('dialog');

      await trigger.click();
      const input = dialog.getByLabel('Gõ tên nhà để xác nhận');
      const confirmBtn = dialog.getByRole('button', { name: 'Xoá nhà', exact: true });
      await expect(confirmBtn).toBeDisabled();
      await input.fill('Sai tên');
      await expect(confirmBtn).toBeDisabled();

      await input.fill('  Nhà Ngọc Lan  ');
      await expect(confirmBtn).toBeEnabled();
      await confirmBtn.click();

      await expect(dialog).toHaveCount(0);
      expect(state.deletionPosts).toEqual([{ confirmFamilyName: 'Nhà Ngọc Lan' }]);
      await expect(page.getByText(/Nhà sẽ bị xoá lúc/)).toBeVisible();
      await page.getByRole('button', { name: 'Thu hồi yêu cầu xoá', exact: true }).click();
      await expect(page.getByText(/Nhà sẽ bị xoá lúc/)).toHaveCount(0);
      expect(state.mutationCsrf).toEqual(['csrf', 'csrf']);
    });
  },
  () => {
    test('SPEC-069: lỗi ERR_FAMILY_NOT_EMPTY và ERR_RECENT_REMOVAL hiện thông báo chuẩn', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      state.membersState.members = [
        { accountId: 'account', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: true },
      ];
      await page.goto('/family/home');
      await page.getByRole('button', { name: 'Xoá nhà', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Gõ tên nhà để xác nhận').fill('Nhà Ngọc Lan');
      const confirmBtn = dialog.getByRole('button', { name: 'Xoá nhà', exact: true });

      state.deletionError = 'ERR_FAMILY_NOT_EMPTY';
      await confirmBtn.click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Chỉ xoá được khi bạn là người duy nhất trong nhà.',
      );

      state.deletionError = 'ERR_RECENT_REMOVAL';
      state.deletionErrorDetails = { allowedAt: '2026-11-25T02:05:00.000Z' };
      await confirmBtn.click();
      await expect(dialog.getByRole('alert')).toContainText(
        'Chưa thể xoá nhà. Bạn xoá được từ 25/11/2026 09:05.',
      );
    });
  },
];
