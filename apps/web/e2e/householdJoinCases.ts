import { expect, test } from '@playwright/test';
import { householdJoinFixture } from './householdJoinFixture.js';
import { householdInvitationFixture } from './householdInvitationFixture.js';
import { saveHouseholdScreenshot } from './saveHouseholdScreenshot.js';

export const householdJoinCases = [
  () => {
    test('TC-775: người gửi tạo mã, tài khoản khác nhập chính mã đó và vào nhà', async ({
      page,
      browser,
    }) => {
      const sender = await browser.newPage({ locale: 'vi-VN' });
      try {
        const invitation = await householdInvitationFixture(sender);
        await sender.goto('http://127.0.0.1:5177/family/invite');
        await sender.getByRole('radio', { name: /Thành viên/ }).check();
        await sender.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
        const code = sender.getByLabel('Mã mời', { exact: true });
        await expect(code).toBeVisible();
        const receiver = await householdJoinFixture(page);
        await page.goto('/waiting');
        await page.getByRole('link', { name: /Tôi có mã mời/ }).click();
        await page.getByLabel('Mã mời', { exact: true }).fill((await code.textContent())!);
        await saveHouseholdScreenshot(page, 'join-filled');
        await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
        await expect(page).toHaveURL(/\/$/);
        expect(receiver.accepts).toEqual([{ body: { token: invitation.issued.code }, csrf: 'csrf' }]);
        expect(receiver.household.family).toBe(true);
        expect(receiver.household.linked).toBe(false);
      } finally {
        await sender.close();
      }
    });
  },
  () => {
    test('TC-775: thẻ nhận mã bấm được, chuẩn hóa mã và vào nhà không tự liên kết hồ sơ', async ({
      page,
    }) => {
      const state = await householdJoinFixture(page);
      await page.goto('/waiting');
      await page.getByRole('link', { name: /Tôi có mã mời/ }).click();
      await expect(page).toHaveURL(/\/waiting\?step=join$/);
      await page.getByLabel('Mã mời', { exact: true }).fill('a7f2 9c4e 8b1d');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
      await expect(page).toHaveURL(/\/$/);
      expect(state.accepts).toEqual([{ body: { token: 'A7F29C4E8B1D' }, csrf: 'csrf' }]);
      expect(state.household.role).toBe('member');
      expect(state.household.linked).toBe(false);
    });
  },
  () => {
    test('TC-777: mã sai định dạng không gửi API, mã vô hiệu giữ ô nhập và không lộ lỗi nội bộ', async ({
      page,
    }) => {
      const state = await householdJoinFixture(page);
      await page.goto('/waiting?step=join');
      await page.getByLabel('Mã mời', { exact: true }).fill('123');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
      await expect(page.getByRole('alert')).toContainText('12 ký tự');
      expect(state.accepts).toHaveLength(0);
      state.error = 'ERR_NOT_FOUND';
      await page.getByLabel('Mã mời', { exact: true }).fill('A7F29C4E8B1D');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
      await expect(page.getByRole('alert')).toContainText('Lời mời không còn dùng được');
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveValue('A7F29C4E8B1D');
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
      expect(state.household.family).toBe(false);
    });
  },
  () => {
    test('TC-775: bấm lặp khi đang xác nhận chỉ gửi một lần', async ({ page }) => {
      const state = await householdJoinFixture(page);
      let release!: () => void;
      state.hold = new Promise((resolve) => {
        release = resolve;
      });
      await page.goto('/waiting?step=join');
      await page.getByLabel('Mã mời', { exact: true }).fill('A7F29C4E8B1D');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).dblclick();
      await expect(page.getByRole('button', { name: 'Đang xác nhận…' })).toBeDisabled();
      await expect(page.getByLabel('Mã mời', { exact: true })).toBeDisabled();
      expect(state.accepts).toHaveLength(1);
      release();
      await expect(page).toHaveURL(/\/$/);
    });
  },
  () => {
    test('TC-775: xác nhận xong nhưng GET phiên lỗi thì chỉ tải lại, không nhận mã lần hai', async ({
      page,
    }) => {
      const state = await householdJoinFixture(page);
      state.household.failRefresh = true;
      await page.goto('/waiting?step=join');
      await page.getByLabel('Mã mời', { exact: true }).fill('A7F29C4E8B1D');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
      await expect(page.getByRole('alert')).toContainText('Đã nhận lời mời');
      await expect(page.getByLabel('Mã mời', { exact: true })).toBeDisabled();
      state.household.failRefresh = false;
      await page.getByRole('button', { name: 'Tải lại thông tin nhà' }).click();
      await expect(page).toHaveURL(/\/$/);
      expect(state.accepts).toHaveLength(1);
    });
  },
  () => {
    test('TC-776: đã thuộc nhà khác hiển thị hướng dẫn, không tự chuyển nhà', async ({ page }) => {
      const state = await householdJoinFixture(page);
      state.error = 'ERR_ACCOUNT_ALREADY_IN_FAMILY';
      state.status = 409;
      await page.goto('/waiting?step=join');
      await page.getByLabel('Mã mời', { exact: true }).fill('A7F29C4E8B1D');
      await page.getByRole('button', { name: 'Xác nhận vào nhà' }).click();
      await expect(page.getByRole('alert')).toContainText('Hãy rời nhà hiện tại');
      await expect(page).toHaveURL(/\/waiting\?step=join$/);
    });
  },
  () => {
    test('TC-775: 360px/chữ 200% không tràn, tải lại và quay lại không nhận mã', async ({ page }) => {
      const state = await householdJoinFixture(page);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/waiting?step=join');
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      await expect(page.getByLabel('Mã mời', { exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const back = await page.getByRole('link', { name: 'Quay lại', exact: true }).boundingBox();
      const title = await page.getByRole('heading', { name: 'Tôi có mã mời' }).boundingBox();
      expect(back!.y + back!.height).toBeLessThanOrEqual(title!.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.reload();
      await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Bắt đầu', exact: true })).toBeVisible();
      expect(state.accepts).toHaveLength(0);
    });
  },
];
