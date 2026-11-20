import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

export const householdHomeOwnershipCases = [
  () => {
    test('SPEC-068: Chủ hộ gửi và thu hồi đề nghị trao quyền thành công', async ({ page }) => {
      const state = await householdHomeFixture(page);
      await page.goto('/family/home');
      await expect(page.getByRole('heading', { name: 'Nhà Ngọc Lan', exact: true })).toBeVisible();
      await expect(page.getByText('3 thành viên · 1 Chủ hộ / 1 Đồng quản lý / 1 Thành viên')).toBeVisible();

      await page.getByRole('button', { name: 'Gửi đề nghị', exact: true }).click();
      await expect(page.getByText('Đã gửi đề nghị cho Anh Tuấn · đang chờ trả lời')).toBeVisible();
      expect(state.offerPosts).toEqual([{ targetAccountId: 'main-tuan' }]);

      await page.getByRole('button', { name: 'Thu hồi đề nghị', exact: true }).click();
      await expect(page.getByText('Đã gửi đề nghị cho Anh Tuấn · đang chờ trả lời')).toHaveCount(0);
      expect(state.mutationCsrf).toEqual(['csrf', 'csrf']);
    });
  },
  () => {
    test('SPEC-068: lỗi ERR_OWNERSHIP_TRANSFER_PENDING hiện thông báo chuẩn', async ({ page }) => {
      const state = await householdHomeFixture(page);
      state.offerError = 'ERR_OWNERSHIP_TRANSFER_PENDING';
      await page.goto('/family/home');

      await page.getByRole('button', { name: 'Gửi đề nghị', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Đang có đề nghị trao quyền Chủ hộ chờ trả lời.');
    });
  },
  () => {
    test('SPEC-068: người nhận từ chối hoặc chấp nhận đề nghị làm Chủ hộ', async ({ page }) => {
      const state = await householdHomeFixture(page);
      state.membersState.members = [
        { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
        { accountId: 'account', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: true },
      ];
      state.offer = {
        id: 'offer-1',
        status: 'pending',
        createdAt: '2026-11-19T10:00:00.000Z',
        offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
        target: { accountId: 'account', displayName: 'Anh Tuấn' },
      };

      await page.goto('/family/home');
      await expect(page.getByText('Ba Minh đề nghị bạn làm Chủ hộ Nhà Ngọc Lan.')).toBeVisible();
      await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
      await expect(page.getByText('Ba Minh đề nghị bạn làm Chủ hộ Nhà Ngọc Lan.')).toHaveCount(0);

      state.offer = {
        id: 'offer-2',
        status: 'pending',
        createdAt: '2026-11-19T10:05:00.000Z',
        offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
        target: { accountId: 'account', displayName: 'Anh Tuấn' },
      };
      await page.reload();
      await page.getByRole('button', { name: 'Chấp nhận', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xoá nhà', exact: true })).toBeVisible();
      expect(state.mutationCsrf).toEqual(['csrf', 'csrf']);
    });
  },
];
