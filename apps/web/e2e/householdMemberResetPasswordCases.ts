import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';

async function installClipboardSpy(page: Page) {
  await page.addInitScript(() => {
    const writes: string[] = [];
    Object.defineProperty(window, '__copiedTexts', { value: writes, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          writes.push(text);
        },
      },
    });
  });
}

async function verifyResultAndClose(page: Page, trigger: Locator) {
  const resultDialog = page.getByRole('dialog', { name: 'Mật khẩu tạm của Mẹ Hoa', exact: true });
  await expect(resultDialog).toBeVisible();
  const resultHeading = resultDialog.getByRole('heading', { name: 'Mật khẩu tạm của Mẹ Hoa', exact: true });
  await expect(resultHeading).toBeFocused();
  await expect(resultDialog.locator('code')).toHaveText('TempPass89!x');
  await expect(resultDialog).toContainText('Chỉ hiện một lần. Hết hạn lúc 11:30 ngày 24/11/2026.');
  await expect(resultDialog).not.toContainText('Mật khẩu một lần');
  await expect(resultDialog).not.toContainText('Đã tạo thành công');

  await resultDialog.getByRole('button', { name: 'Sao chép', exact: true }).click();
  await expect(resultDialog.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  await expect(resultDialog.getByRole('status')).toHaveText('Đã sao chép');
  const copied = await page.evaluate(
    () => (window as unknown as { __copiedTexts?: string[] }).__copiedTexts ?? [],
  );
  expect(copied).toEqual(['TempPass89!x']);

  const stored = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
  expect(stored).not.toContain('TempPass89!x');

  await resultDialog.getByRole('button', { name: 'Xong', exact: true }).click();
  await expect(resultDialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByText('TempPass89!x')).toHaveCount(0);

  // Mở lại phải hiện hộp xác nhận, không hiện lại mật khẩu cũ.
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Đặt lại mật khẩu cho Mẹ Hoa?', exact: true })).toBeVisible();
  await expect(page.getByText('TempPass89!x')).toHaveCount(0);
}

async function runHappyPath(page: Page) {
  await installClipboardSpy(page);
  const state = await householdHomeFixture(page);
  setFourHouseholdMembers(state);
  let release!: () => void;
  state.membersState.resetHold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto('/family/home');
  await page.getByRole('button', { name: /Mẹ Hoa/ }).click();

  const trigger = page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const confirmDialog = page.getByRole('dialog', { name: 'Đặt lại mật khẩu cho Mẹ Hoa?', exact: true });
  await expect(confirmDialog).toBeVisible();
  await expect(confirmDialog.getByRole('button', { name: 'Huỷ', exact: true })).toBeFocused();
  await expect(confirmDialog).toContainText('Mẹ Hoa sẽ bị đăng xuất khỏi mọi thiết bị.');
  await expect(confirmDialog).toContainText('Mật khẩu tạm có hiệu lực 24 giờ.');
  await expect(confirmDialog).toContainText('Mẹ Hoa phải đổi mật khẩu khi đăng nhập.');
  await expect(confirmDialog).not.toContainText('Xác nhận cấp mật khẩu tạm thời');

  await page.keyboard.press('Escape');
  await expect(confirmDialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(state.membersState.passwordResets).toHaveLength(0);

  await trigger.click();
  await confirmDialog.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
  await expect(confirmDialog.getByRole('button', { name: 'Đang đặt lại…' })).toBeDisabled();
  release();
  state.membersState.resetHold = null;

  expect(state.membersState.passwordResets).toEqual([
    { path: '/api/family/members/member-hoa/password-reset', csrf: 'csrf' },
  ]);
  await verifyResultAndClose(page, trigger);
}

export const householdMemberResetPasswordCases = [
  () => {
    test('TC-756: đặt lại mật khẩu thành viên — xác nhận, hiện mật khẩu một lần, sao chép và xoá khi đóng', async ({
      page,
    }) => {
      await runHappyPath(page);
    });
  },
  () => {
    test('SPEC-062: lỗi 429 hiện alert trong hộp xác nhận, nút vẫn bấm được và thử lại thành công', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      state.membersState.resetError = 'ERR_RATE_LIMITED';
      state.membersState.resetStatus = 429;
      await page.goto('/family/home');
      await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
      await page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();

      const dialog = page.getByRole('dialog', { name: 'Đặt lại mật khẩu cho Mẹ Hoa?', exact: true });
      const confirmBtn = dialog.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true });
      await confirmBtn.click();

      await expect(dialog.getByRole('alert')).toHaveText('Bạn thao tác quá nhanh, vui lòng thử lại sau.');
      await expect(dialog).not.toContainText('Chi tiết nội bộ');
      await expect(confirmBtn).toBeEnabled();

      state.membersState.resetError = '';
      await confirmBtn.click();
      await expect(page.getByRole('dialog', { name: 'Mật khẩu tạm của Mẹ Hoa', exact: true })).toBeVisible();
      expect(state.membersState.passwordResets).toHaveLength(2);
    });
  },
  ...(
    [
      ['TC-760', 'ERR_NOT_FOUND', 404, 'Người này không còn trong nhà.'],
      ['TC-757', 'ERR_OWNER_PROTECTED', 403, 'Không thể thao tác với Chủ hộ.'],
      ['TC-759', 'ERR_FORBIDDEN', 403, 'Bạn không có quyền thực hiện thao tác này.'],
    ] as const
  ).map(([tc, code, status, message]) => () => {
    test(`${tc}: lỗi ${code} khi đặt lại mật khẩu hiện câu catalog và tải lại danh sách`, async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.goto('/family/home');
      await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
      const beforeReloads = state.membersState.listCount;

      state.membersState.resetError = code;
      state.membersState.resetStatus = status;
      if (code === 'ERR_NOT_FOUND') {
        state.membersState.members = state.membersState.members.filter((m) => m.accountId !== 'member-hoa');
      }

      await page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'Đặt lại mật khẩu cho Mẹ Hoa?', exact: true })
        .getByRole('button', { name: 'Đặt lại mật khẩu', exact: true })
        .click();

      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
      expect(state.membersState.listCount).toBeGreaterThan(beforeReloads);
      if (code !== 'ERR_FORBIDDEN') {
        await expect(page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true })).toHaveCount(0);
      }
    });
  }),
];
