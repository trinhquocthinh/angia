import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

export const householdMemberOfferRefreshCases = [
  () => {
    test('SPEC-068: hạ vai trò người nhận đề nghị cập nhật băng trao quyền ngay trên trang', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      state.offer = {
        id: 'offer-1',
        status: 'pending',
        createdAt: '2026-11-20T08:00:00.000Z',
        offeredBy: { accountId: 'account', displayName: 'Ba Minh' },
        target: { accountId: 'main-tuan', displayName: 'Anh Tuấn' },
      };
      await page.route('**/api/family/members/main-tuan', (route) => {
        // API tự thu hồi đề nghị khi hạ vai trò hoặc gỡ người nhận (SPEC-068).
        if (route.request().method() === 'PATCH') state.offer = null;
        return route.fallback();
      });
      await page.goto('/family/home');
      const banner = page.getByText('Đã gửi đề nghị cho Anh Tuấn · đang chờ trả lời', { exact: true });
      await expect(banner).toBeVisible();
      await page.getByRole('button', { name: /Anh Tuấn/ }).click();
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Đã đổi vai trò');
      await expect(banner).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Gửi đề nghị', exact: true })).toBeDisabled();
      await expect(page).toHaveURL(/\/family\/home$/);
    });
  },
];
