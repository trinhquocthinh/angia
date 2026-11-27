import { fillLogin, fillRegistration } from './accountChecks.js';
import { expect, test, type Page } from '@playwright/test';
import { householdInviteLinkFixture, invitationPath, invitationToken } from './householdInviteLinkFixture.js';

async function register(page: Page) {
  await page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByText('Đăng nhập hoặc tạo tài khoản để nhận lời mời.')).toBeVisible();
  await fillRegistration(page);
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
}
export const householdInviteLinkAuthCases = [
  () => {
    test('E27-AT-D1: khách đăng nhập rồi nhận lời mời bằng token đang chờ', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.household.signedIn = false;
      await page.goto(invitationPath);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByText('Đăng nhập hoặc tạo tài khoản để nhận lời mời.')).toBeVisible();
      expect(state.inspections).toHaveLength(0);
      await fillLogin(page);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(page).toHaveURL(/\/invite$/);
      await page.getByRole('button', { name: 'Nhận lời mời', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(state.household.name, { exact: true }).first()).toBeVisible();
      expect(state.accepts).toEqual([{ body: { token: invitationToken }, csrf: 'csrf' }]);
    });
  },
  () => {
    test('SPEC-065: đăng ký link join vào nhà ngay, không gọi accept', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.household.signedIn = false;
      await page.goto(invitationPath);
      await expect(page).toHaveURL(/\/login$/);
      await register(page);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(state.household.name, { exact: true }).first()).toBeVisible();
      expect(state.registrations).toHaveLength(1);
      expect(state.registrations[0]).toMatchObject({ invitationToken });
      expect(state.accepts).toHaveLength(0);
      expect(state.household.family).toBe(true);
    });
  },
  () => {
    test('SPEC-065: đăng ký link found giữ token tới khi lập nhà', async ({ page }) => {
      const state = await householdInviteLinkFixture(page);
      state.household.signedIn = false;
      state.kind = 'found_family';
      await page.goto(invitationPath);
      await expect(page).toHaveURL(/\/login$/);
      await register(page);
      await expect(page).toHaveURL(/\/invite$/);
      await expect(page.getByRole('heading', { name: 'Lập nhà mới theo lời mời' })).toBeVisible();
      await page.getByLabel('Tên nhà', { exact: true }).fill('Nhà Hoa');
      await page.getByRole('button', { name: 'Tạo nhà', exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('link', { name: 'Nhà', exact: true }).first()).toBeVisible();
      expect(state.registrations[0]).toMatchObject({ invitationToken });
      expect(state.household.writes).toEqual([{ body: { name: 'Nhà Hoa', invitationToken }, csrf: 'csrf' }]);
      expect(state.accepts).toHaveLength(0);
    });
  },
];
