import { expect, test } from '@playwright/test';
import { householdInviteLinkFixture, invitationPath, invitationToken } from './householdInviteLinkFixture.js';
export const householdInviteLinkJoinCases = [
  () => {
    for (const [role, label] of [
      ['member', 'Thành viên'],
      ['main', 'Đồng quản lý'],
    ] as const) {
      test(`E27-AT-D1: link join ${role} xoá fragment, xác nhận đúng vai trò và CSRF`, async ({ page }) => {
        const state = await householdInviteLinkFixture(page);
        state.role = role;
        await page.goto(invitationPath);
        await expect(page).toHaveURL(/\/invite$/);
        await expect(page.getByRole('heading', { name: 'Nhận lời mời vào nhà' })).toBeVisible();
        await expect(page.getByText(`Bạn được mời tham gia một nhà với vai trò ${label}.`)).toBeVisible();
        await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
        // Trang chủ của main không hiện tên nhà; kiểm điều hướng Nhà thay thế.
        await expect(
          role === 'member'
            ? page.getByText(state.household.name, { exact: true }).first()
            : page.getByRole('link', { name: 'Nhà', exact: true }).first(),
        ).toBeVisible();
        expect(state.inspections).toEqual([{ token: invitationToken }]);
        expect(state.accepts).toEqual([{ body: { token: invitationToken }, csrf: 'csrf' }]);
        expect(state.household.family).toBe(true);
        expect(state.household.role).toBe(role);
        expect(state.household.linked).toBe(false);
      });
    }
  },
  () => {
    test('SPEC-065: link lập nhà gửi name và invitationToken cùng CSRF', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.kind = 'found_family';
      await page.goto(invitationPath);
      await expect(page.getByRole('heading', { name: 'Lập nhà mới theo lời mời' })).toBeVisible();
      await page.getByLabel('Tên nhà', { exact: true }).fill(' Nhà Hoa ');
      await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('link', { name: 'Nhà', exact: true }).first()).toBeVisible();
      expect(state.household.writes).toEqual([{ body: { name: 'Nhà Hoa', invitationToken }, csrf: 'csrf' }]);
      expect(state.accepts).toHaveLength(0);
    });
  },
  () => {
    test('E27-AT-D1: legal gate giữ token, đồng ý rồi quay lại nhận lần hai', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.legalRequired = true;
      await page.goto(invitationPath);
      await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
      await expect(page).toHaveURL(/\/account\/legal-update$/);
      await page.getByRole('button', { name: 'Đồng ý và tiếp tục' }).click();
      await expect(page).toHaveURL(/\/invite$/);
      await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(state.household.name, { exact: true }).first()).toBeVisible();
      expect(state.accepts).toEqual(
        Array.from({ length: 2 }, () => ({ body: { token: invitationToken }, csrf: 'csrf' })),
      );
    });
  },
  () => {
    test('E27-AT-D1: sau khi xoá fragment tải lại mất token và không inspect lần nữa', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      await page.goto(invitationPath);
      await expect(page.getByRole('button', { name: 'Nhận lời mời', exact: true })).toBeVisible();
      const count = state.inspections.length;
      await page.reload();
      await expect(page.getByRole('alert')).toHaveText(
        'Không tìm thấy lời mời. Hãy mở lại link mời bạn nhận được.',
      );
      expect(state.inspections).toHaveLength(count);
      expect(state.accepts).toHaveLength(0);
    });
  },
  () => {
    test('E27-AT-D1: token không lưu URL/storage/cookie/console, chỉ trong body POST được phép', async ({
      page,
    }) => {
      const state = await householdInviteLinkFixture(page);
      await page.goto(invitationPath);
      await expect(page.getByRole('heading', { name: 'Nhận lời mời vào nhà' })).toBeVisible();
      const stored = await page.evaluate(() =>
        JSON.stringify({
          href: location.href,
          local: { ...localStorage },
          session: { ...sessionStorage },
          cookie: document.cookie,
        }),
      );
      expect(stored).not.toContain(invitationToken);
      await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(state.household.name, { exact: true }).first()).toBeVisible();
      expect(state.console.join('\n')).not.toContain(invitationToken);
      for (const request of state.requests) {
        expect(request.url).not.toContain(invitationToken);
        if (request.body?.includes(invitationToken)) {
          expect(request.method).toBe('POST');
          expect(new URL(request.url).pathname).toMatch(
            /^\/api\/(invitations\/(inspect|accept)|auth\/register|families)$/,
          );
        }
      }
    });
  },
  () => {
    test('E27-AT-D1: bấm đúp chỉ accept một lần, GET phiên lỗi chỉ tải lại GET', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.household.failRefresh = true;
      let release!: () => void;
      state.hold = new Promise((resolve) => {
        release = resolve;
      });
      await page.goto(invitationPath);
      await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).dblclick();
      await expect(page.getByRole('button', { name: 'Đang xác nhận…' })).toBeDisabled();
      expect(state.accepts).toHaveLength(1);
      release();
      await expect(page.getByRole('alert')).toContainText('Đã nhận lời mời');
      state.household.failRefresh = false;
      await page.getByRole('button', { name: 'Tải lại thông tin nhà' }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(state.household.name, { exact: true }).first()).toBeVisible();
      expect(state.accepts).toHaveLength(1);
    });
  },
];
