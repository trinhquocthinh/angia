import { expect, test } from '@playwright/test';
import { householdInviteLinkFixture, invitationPath } from './householdInviteLinkFixture.js';
export const householdInviteLinkErrorCases = [
  () => {
    test('E27-AT-D1: inspect 404 đại diện hết hạn, thu hồi, đã dùng và sai', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.inspectError = 'ERR_NOT_FOUND';
      await page.goto(invitationPath);
      await expect(page.getByRole('alert')).toHaveText(
        'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.',
      );
      expect(state.accepts).toHaveLength(0);
      await page.getByRole('button', { name: 'Về trang chủ' }).click();
      await expect(page).toHaveURL(/\/waiting$/);
    });
  },
  () => {
    test('E27-AT-D1: fragment sai định dạng bị xoá, không inspect/accept', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      await page.goto('/invite#token=abc');
      await expect(page).toHaveURL(/\/invite$/);
      await expect(page.getByRole('alert')).toHaveText(
        'Không tìm thấy lời mời. Hãy mở lại link mời bạn nhận được.',
      );
      expect(state.inspections).toHaveLength(0);
      expect(state.accepts).toHaveLength(0);
    });
  },
  () => {
    for (const [code, status, message] of [
      ['ERR_NOT_FOUND', 404, 'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.'],
      [
        'ERR_ACCOUNT_ALREADY_IN_FAMILY',
        409,
        'Bạn đang thuộc một nhà. Hãy rời nhà hiện tại trước khi nhận lời mời khác.',
      ],
    ] as const) {
      test(`SPEC-065: accept ${status} ${code} sau inspect thành công`, async ({ page }) => {
        const state = await householdInviteLinkFixture(page);
        state.acceptError = code;
        state.acceptStatus = status;
        await page.goto(invitationPath);
        await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
        await expect(page.getByRole('alert')).toHaveText(message);
        await expect(page.getByRole('button', { name: 'Nhận lời mời', exact: true })).toHaveCount(0);
        expect(state.accepts).toHaveLength(1);
      });
    }
  },
  () => {
    test('SPEC-065: lời mời lập nhà bị đóng hiển thị hướng dẫn link mới', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.kind = 'found_family';
      state.household.code = 'ERR_REGISTRATION_CLOSED';
      await page.goto(invitationPath);
      await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Hoa');
      await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(
        'Lời mời lập nhà không còn dùng được. Hãy nhờ quản trị viên gửi link mới.',
      );
      await expect(page.getByRole('button', { name: 'Tạo nhà', exact: true })).toBeDisabled();
    });
  },
  () => {
    test('E27-AT-D1: phiên đã thuộc nhà không inspect/accept', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.household.family = true;
      await page.goto(invitationPath);
      await expect(page.getByRole('alert')).toContainText('Hãy rời nhà hiện tại');
      expect(state.inspections).toHaveLength(0);
      expect(state.accepts).toHaveLength(0);
      await page.getByRole('button', { name: 'Về trang chủ' }).click();
      await expect(page).toHaveURL(/\/$/);
    });
  },
  () => {
    for (const [code, message] of [
      ['ERR_RATE_LIMITED', 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.'],
      ['NETWORK', 'Chưa thể kiểm tra lời mời. Vui lòng thử lại.'],
    ]) {
      test(`E27-AT-D1: inspect ${code} cho phép thử lại`, async ({ page }) => {
        const state = await householdInviteLinkFixture(page);
        state.inspectError = code!;
        await page.goto(invitationPath);
        await expect(page.getByRole('alert')).toHaveText(message!);
        state.inspectError = '';
        await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Nhận lời mời', exact: true })).toBeVisible();
        expect(state.accepts).toHaveLength(0);
      });
    }
  },
];
