import { expect, test, type Page } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

type Flow = 'ownership' | 'leave' | 'deletion';
async function prepare(page: Page, flow: Flow) {
  const state = await householdHomeFixture(page);
  if (flow === 'leave')
    state.membersState.members.forEach((m) => {
      m.isOwner = !m.isSelf;
    });
  if (flow === 'deletion') state.membersState.members = state.membersState.members.filter((m) => m.isSelf);
  await page.goto('/family/home');
  if (flow !== 'ownership')
    await page.getByRole('button', { name: flow === 'leave' ? 'Rời nhà' : 'Xoá nhà', exact: true }).click();
  if (flow === 'deletion') await page.getByLabel('Gõ tên nhà để xác nhận').fill('Nhà Ngọc Lan');
  return state;
}
const common = [
  ['ERR_FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'],
  ['ERR_UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
  ['ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
] as const;
const errors = {
  ownership: [...common, ['ERR_NOT_FOUND', 'Đề nghị trao quyền không còn hiệu lực.']],
  leave: common,
  deletion: [
    ...common.slice(0, 2),
    ['ERR_VALIDATION', 'Tên nhà chưa khớp.'],
    ['ERR_DELETION_PENDING', 'Nhà đang có yêu cầu xoá chờ xử lý.'],
  ],
};
export function householdHomeErrorCases() {
  for (const flow of ['ownership', 'leave', 'deletion'] as const) {
    for (const [code, message] of errors[flow]) {
      test(`${flow}: ${code} không lộ thông báo nội bộ`, async ({ page }) => {
        const state = await prepare(page, flow);
        if (flow === 'ownership') state.offerError = code!;
        if (flow === 'leave') state.leaveError = code!;
        if (flow === 'deletion') state.deletionError = code!;
        await submit(page, flow);
        await expect(page.getByRole('alert')).toHaveText(message!);
        await expect(page.getByText('Nội bộ', { exact: true })).toHaveCount(0);
        expect(state.mutationCsrf).toEqual(['csrf']);
      });
    }
    for (const fault of ['NETWORK', 'SERVER'] as const) {
      test(`${flow}: lỗi ${fault} giữ màn hình và cho thử lại`, async ({ page }) => {
        const state = await prepare(page, flow);
        state.transportError = fault;
        await submit(page, flow);
        await expect(page.getByRole('alert')).toHaveText(
          fault === 'NETWORK'
            ? 'Mất kết nối. Kiểm tra mạng rồi thử lại.'
            : 'Chưa thể thực hiện thao tác. Vui lòng thử lại.',
        );
        state.transportError = '';
        await submit(page, flow);
        if (flow === 'leave') await expect(page).toHaveURL(/\/waiting$/);
        else
          await expect(
            page.getByText(flow === 'ownership' ? /Đã gửi đề nghị cho/ : /Nhà sẽ bị xoá lúc/),
          ).toBeVisible();
      });
    }
  }
}
async function submit(page: Page, flow: Flow) {
  const root = flow === 'ownership' ? page : page.getByRole('dialog');
  await root
    .getByRole('button', {
      name: flow === 'ownership' ? 'Gửi đề nghị' : flow === 'leave' ? 'Rời nhà' : 'Xoá nhà',
      exact: true,
    })
    .click();
}
