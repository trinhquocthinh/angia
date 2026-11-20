import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

export function householdHomeRegressionCases() {
  test('SPEC-067/069: Chủ hộ còn người khác bị chặn rời và xoá nhà', async ({ page }) => {
    const state = await householdHomeFixture(page);
    await page.goto('/family/home');
    await expect(page.getByText('Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rời nhà (Đang là Chủ hộ)', exact: true })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Xoá nhà (Còn thành viên khác)', exact: true }),
    ).toBeDisabled();
    expect(state.mutationCsrf).toEqual([]);
  });
  test('SPEC-069: executeAt thật giảm theo thời gian và khoá thu hồi khi đến hạn', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T07:00:00Z') });
    const state = await householdHomeFixture(page);
    state.membersState.members = state.membersState.members.filter((m) => m.isSelf);
    state.deletion = { id: 'del-1', status: 'pending', executeAt: '2026-11-20T08:10:00Z' };
    await page.goto('/family/home');
    await expect(page.getByText(/Nhà sẽ bị xoá lúc/)).toHaveText(
      'Nhà sẽ bị xoá lúc 20/11/2026 15:10 (còn 1 giờ 10 phút)',
    );
    await page.clock.fastForward(60_000);
    await expect(page.getByText(/Nhà sẽ bị xoá lúc/)).toContainText('1 giờ 9 phút');
    await page.clock.fastForward(69 * 60_000);
    await expect(page.getByText(/Nhà sẽ bị xoá lúc/)).toContainText('0 giờ 0 phút');
    await expect(page.getByRole('button', { name: 'Thu hồi yêu cầu xoá', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Xoá nhà', exact: true })).toBeDisabled();
  });
  for (const endpoint of ['ownership-offers', 'deletion-request']) {
    test(`GET ${endpoint}/current: lỗi tải có Thử lại`, async ({ page }) => {
      await householdHomeFixture(page);
      const pattern = `**/api/family/${endpoint}/current`;
      await page.route(pattern, (route) => route.fulfill({ status: 503, body: 'Service unavailable' }));
      await page.goto('/family/home');
      await expect(page.getByRole('alert')).toHaveText('Chưa thể thực hiện thao tác. Vui lòng thử lại.');
      await page.unroute(pattern);
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
    });
  }
  registerDecisionErrors();
}

function registerDecisionErrors() {
  for (const accept of [true, false]) {
    test(`SPEC-068: phản hồi ${accept} gặp đề nghị hết hiệu lực`, async ({ page }) => {
      const state = await householdHomeFixture(page);
      state.membersState.members.forEach((m) => {
        m.isOwner = !m.isSelf;
      });
      state.offer = {
        id: 'offer-1',
        status: 'pending',
        createdAt: '2026-11-19T10:00:00Z',
        offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
        target: { accountId: 'account', displayName: 'Anh Tuấn' },
      };
      state.offerError = 'ERR_NOT_FOUND';
      await page.goto('/family/home');
      await page.getByRole('button', { name: accept ? 'Chấp nhận' : 'Từ chối', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText('Đề nghị trao quyền không còn hiệu lực.');
      await expect(page.getByRole('button', { name: 'Chấp nhận', exact: true })).toBeEnabled();
      expect(state.mutationCsrf).toEqual(['csrf']);
    });
  }
}
