import { expectProtectedMemberResponsive } from './expectProtectedMemberResponsive.js';
import { setFourHouseholdMembers } from './setFourHouseholdMembers.js';
import { expect, test } from '@playwright/test';
import { householdHomeFixture } from './householdHomeFixture.js';

export const householdMembersSafetyCases = [
  () => {
    test('SPEC-066: xác nhận gỡ focus Huỷ, khoá cuộn, giữ focus và Escape không gửi PATCH', async ({
      page,
    }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      await page.goto('/family/home');
      await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
      const trigger = page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true });
      // Click cũng phải trả focus đúng trên WebKit.
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: /^Gỡ / });
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
      const detail = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
      await expect(detail).toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(detail).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Mẹ Hoa/ })).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(state.membersState.patches).toHaveLength(0);
    });
  },
  ...(['change_role', 'remove'] as const).flatMap((action) =>
    ['ERR_NOT_FOUND', 'ERR_OWNER_PROTECTED'].map((code) => () => {
      test(`SPEC-066: ${code} khi ${action} hiện thông báo và ẩn thao tác`, async ({ page }) => {
        const state = await householdHomeFixture(page);
        setFourHouseholdMembers(state);
        await page.goto('/family/home');
        await page.getByRole('button', { name: /Mẹ Hoa/ }).click();
        await expect(page.getByRole('heading', { name: 'Mẹ Hoa', exact: true })).toBeVisible();
        state.membersState.patchError = code;
        state.membersState.patchStatus = code === 'ERR_NOT_FOUND' ? 404 : 403;
        if (code === 'ERR_NOT_FOUND') {
          state.membersState.members = state.membersState.members.filter(
            (member) => member.accountId !== 'member-hoa',
          );
        }
        if (action === 'change_role') {
          await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
          await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
        } else {
          await page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true }).click();
          await page
            .getByRole('dialog', { name: /^Gỡ / })
            .getByRole('button', { name: 'Gỡ khỏi nhà', exact: true })
            .click();
        }
        await expect(
          page.getByText(
            code === 'ERR_NOT_FOUND' ? 'Người này không còn trong nhà.' : 'Không thể thao tác với Chủ hộ.',
            { exact: true },
          ),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Gỡ khỏi nhà', exact: true })).toHaveCount(0);
        await expect(page.getByRole('dialog', { name: /^Gỡ / })).toHaveCount(0);
        await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
        expect(state.membersState.patches).toEqual([
          {
            path: '/api/family/members/member-hoa',
            csrf: 'csrf',
            body: action === 'remove' ? { action } : { action, role: 'main' },
          },
        ]);
        if (code === 'ERR_OWNER_PROTECTED') await expectProtectedMemberResponsive(page);
        if (code === 'ERR_NOT_FOUND') {
          await page.getByRole('button', { name: 'Đóng', exact: true }).click();
          await expect(
            page.getByText('3 thành viên · 1 Chủ hộ / 2 Đồng quản lý / 0 Thành viên'),
          ).toBeVisible();
          await expect(page.getByRole('button', { name: /Mẹ Hoa/ })).toHaveCount(0);
        }
      });
    }),
  ),
  () => {
    test('SPEC-066: tải danh sách lỗi cho thử lại thành công', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      state.membersState.listError = true;
      await page.goto('/family/home');
      await expect(page.getByRole('alert')).toContainText('Chưa thể cập nhật thành viên. Vui lòng thử lại.');
      state.membersState.listError = false;
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await expect(page.getByText('4 thành viên · 1 Chủ hộ / 2 Đồng quản lý / 1 Thành viên')).toBeVisible();
      await expect(page.locator('li.household-member-item')).toHaveCount(4);
      await expect(page.getByRole('alert')).toHaveCount(0);
    });
  },
  () => {
    test('SPEC-066: chỉ có mình hiển thị lời nhắc và mời người thân', async ({ page }) => {
      const state = await householdHomeFixture(page);
      setFourHouseholdMembers(state);
      state.membersState.members = state.membersState.members.filter((member) => member.isSelf);
      await page.goto('/family/home');
      const empty = page.locator('.household-members-empty');
      await expect(empty.getByText('Mới có mình bạn', { exact: true })).toBeVisible();
      await empty.getByRole('link', { name: 'Mời người thân', exact: true }).click();
      await expect(page).toHaveURL(/\/family\/invite$/);
    });
  },
];
