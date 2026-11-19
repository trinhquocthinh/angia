import { expect, test } from '@playwright/test';
import { householdMembersFixture } from './householdMembersFixture.js';

export const householdMembersSafetyCases = [
  () => {
    test('SPEC-066: xác nhận gỡ focus Huỷ, khoá cuộn, giữ focus và Escape không gửi PATCH', async ({
      page,
    }) => {
      const state = await householdMembersFixture(page);
      await page.goto('/family/members/member-hoa');
      const trigger = page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true });
      // Mở bằng bàn phím: WebKit không focus nút khi bấm chuột nên không có gì để trả focus.
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('button', { name: 'Huỷ', exact: true })).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        // Dialog modal native: nội dung ngoài bị inert; Tab qua phần tử cuối có thể ra thanh trình duyệt (body).
        const escaped = await dialog.evaluate(
          (el) => document.activeElement !== document.body && !el.contains(document.activeElement),
        );
        expect(escaped).toBe(false);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.patches).toHaveLength(0);
    });
  },
  ...(['change_role', 'remove'] as const).flatMap((action) =>
    ['ERR_NOT_FOUND', 'ERR_OWNER_PROTECTED'].map((code) => () => {
      test(`SPEC-066: ${code} khi ${action} hiện thông báo và ẩn thao tác`, async ({ page }) => {
        const state = await householdMembersFixture(page);
        await page.goto('/family/members/member-hoa');
        await expect(page.getByRole('heading', { name: 'Mẹ Hoa', exact: true })).toBeVisible();
        state.patchError = code;
        state.patchStatus = code === 'ERR_NOT_FOUND' ? 404 : 403;
        if (code === 'ERR_NOT_FOUND') {
          state.members = state.members.filter((member) => member.accountId !== 'member-hoa');
        }
        if (action === 'change_role') {
          await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
          await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
        } else {
          await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();
          await page.getByRole('dialog').getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();
        }
        await expect(
          page.getByText(
            code === 'ERR_NOT_FOUND' ? 'Người này không còn trong nhà.' : 'Không thể thao tác với Chủ hộ.',
            { exact: true },
          ),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true })).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
        expect(state.patches).toEqual([
          {
            path: '/api/family/members/member-hoa',
            csrf: 'csrf',
            body: action === 'remove' ? { action } : { action, role: 'main' },
          },
        ]);
        if (code === 'ERR_NOT_FOUND') {
          await page.locator('.household-member-protected').getByRole('link').click();
          await expect(page.getByText('Nhà Ngọc Lan · 3 thành viên')).toBeVisible();
          await expect(page.getByRole('link', { name: /Mẹ Hoa/ })).toHaveCount(0);
        }
      });
    }),
  ),
  () => {
    test('SPEC-066: tải danh sách lỗi cho thử lại thành công', async ({ page }) => {
      const state = await householdMembersFixture(page);
      state.listError = true;
      await page.goto('/family/members');
      await expect(page.getByRole('alert')).toContainText('Chưa thể cập nhật thành viên. Vui lòng thử lại.');
      state.listError = false;
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await expect(page.getByText('Nhà Ngọc Lan · 4 thành viên')).toBeVisible();
      await expect(page.locator('li.household-member-item')).toHaveCount(4);
      await expect(page.getByRole('alert')).toHaveCount(0);
    });
  },
  () => {
    test('SPEC-066: chỉ có mình hiển thị lời nhắc và mời người thân', async ({ page }) => {
      const state = await householdMembersFixture(page);
      state.members = state.members.filter((member) => member.isSelf);
      await page.goto('/family/members');
      const empty = page.locator('.household-members-empty');
      await expect(empty.getByText('Mới có mình bạn', { exact: true })).toBeVisible();
      await empty.getByRole('link', { name: 'Mời người thân', exact: true }).click();
      await expect(page).toHaveURL(/\/family\/invite$/);
    });
  },
];
