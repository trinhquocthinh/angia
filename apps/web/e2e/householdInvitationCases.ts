import { expect, test, type Page } from '@playwright/test';
import { householdInvitationFixture } from './householdInvitationFixture.js';
import { saveHouseholdScreenshot } from './saveHouseholdScreenshot.js';

async function issue(page: Page) {
  await page.goto('/family/invite');
  await page.getByRole('radio', { name: /Đồng quản lý/ }).check();
  await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
  await expect(page.getByLabel('Mã mời', { exact: true })).toBeVisible();
}
export const householdInvitationCases = [
  () => {
    test('TC-777: giữ lời mời, Escape và thu hồi có focus đúng, không xoá khi chưa xác nhận', async ({
      page,
    }, info) => {
      const state = await householdInvitationFixture(page);
      await issue(page);
      await saveHouseholdScreenshot(page, 'share');
      const trigger = page.getByRole('button', { name: 'Thu hồi lời mời', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Thu hồi lời mời này?' });
      await expect(dialog).toBeVisible();
      await saveHouseholdScreenshot(page, 'revoke');
      await expect(dialog).toHaveCSS('border-top-left-radius', '28px');
      const box = await dialog.boundingBox();
      if (info.project.name.includes('touch'))
        expect(Math.abs(box!.y + box!.height - page.viewportSize()!.height)).toBeLessThan(2);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(state.revokes).toHaveLength(0);
      await trigger.click();
      await dialog.getByRole('button', { name: 'Giữ lời mời' }).click();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await expect(page.getByText('Đã thu hồi lời mời', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tạo lời mời mới' })).toBeFocused();
      expect(state.revokes).toEqual([`/api/family/invitations/${state.issued.invitationId}`]);
    });
  },
  () => {
    test('TC-777: đang thu hồi chặn Escape và bấm lặp, chỉ phản hồi API mới ẩn mã', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      await issue(page);
      let release!: () => void;
      state.hold = new Promise((resolve) => {
        release = resolve;
      });
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await expect(dialog.getByRole('button', { name: 'Đang thu hồi…' })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
      expect(state.revokes).toHaveLength(1);
      release();
      await expect(dialog).toHaveCount(0);
    });
  },
  () => {
    test('TC-777: mất mạng giữ mã, 404 không bị báo thành đã thu hồi hoặc hết hạn', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      await issue(page);
      state.error = 'NETWORK';
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('Mất kết nối');
      await dialog.getByRole('button', { name: 'Giữ lời mời' }).click();
      await expect(page.getByLabel('Mã mời', { exact: true })).toBeVisible();
      state.error = 'ERR_NOT_FOUND';
      await page.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await dialog.getByRole('button', { name: 'Thu hồi lời mời', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Tạo lời mời mới' })).toBeVisible();
      await expect(page.getByText('Đã thu hồi lời mời', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Đã hết hạn', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
    });
  },
  () => {
    test('TC-777: đến hạn tự khoá gửi mã và chỉ tạo lại sau thao tác rõ ràng', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      const now = Date.now();
      await page.clock.install({ time: new Date(now) });
      state.issued.expiresAt = new Date(now + 60_000).toISOString();
      await issue(page);
      await page.clock.fastForward(61_000);
      await expect(page.getByText('Mã đã hết hạn', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sao chép mã', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Sao chép link', exact: true })).toBeDisabled();
      await saveHouseholdScreenshot(page, 'expired');
      expect(state.creates).toHaveLength(1);
      state.issued.expiresAt = new Date(now + 700000).toISOString();
      await page.getByRole('button', { name: 'Tạo lời mời mới' }).click();
      await expect(page.getByRole('button', { name: 'Sao chép mã', exact: true })).toBeEnabled();
      expect(state.creates).toHaveLength(2);
    });
  },
  () => {
    test('TC-773: chia sẻ đúng link, huỷ share sheet không tự sao chép', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      await page.addInitScript(() => {
        Reflect.set(window, 'invitationShares', []);
        Reflect.set(window, 'invitationCopies', []);
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: async (data: ShareData) => {
            (Reflect.get(window, 'invitationShares') as ShareData[]).push(data);
            throw new DOMException('Huỷ', 'AbortError');
          },
        });
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              (Reflect.get(window, 'invitationCopies') as string[]).push(text);
            },
          },
        });
      });
      await issue(page);
      await page.getByRole('button', { name: 'Gửi qua Zalo' }).click();
      await expect
        .poll(() => page.evaluate(() => Reflect.get(window, 'invitationShares')))
        .toEqual([
          {
            title: 'Lời mời AN GIA',
            text: `Mời bạn tham gia nhà trên AN GIA. Mã mời: ${state.issued.code}.`,
            url: state.issued.link,
          },
        ]);
      expect(await page.evaluate(() => Reflect.get(window, 'invitationCopies'))).toEqual([]);
      await expect(page.getByText('Đã chia sẻ lời mời.', { exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Sao chép link', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Đã sao chép link lời mời.' })).toBeVisible();
      expect(await page.evaluate(() => Reflect.get(window, 'invitationCopies'))).toEqual([state.issued.link]);
    });
  },
  () => {
    test('TC-773: thiếu share/clipboard thì hiện nội dung sao chép thủ công, không báo đã sao chép', async ({
      page,
    }) => {
      const state = await householdInvitationFixture(page);
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      });
      await issue(page);
      await page.getByRole('button', { name: 'Sao chép lời mời', exact: true }).click();
      await expect(page.getByLabel('Nội dung để sao chép')).toHaveValue(
        `Mời bạn tham gia nhà trên AN GIA. Mã mời: ${state.issued.code}.\n${state.issued.link}`,
      );
      await expect(page.getByText('Đã sao chép lời mời.', { exact: false })).toHaveCount(0);
    });
  },
  () => {
    test('TC-774: thành viên không có lối mời và không gọi API phát hành', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      state.household.role = 'member';
      await page.goto('/family/invite');
      await expect(page.getByRole('alert')).toContainText('Chỉ Chủ hộ hoặc Đồng quản lý');
      await expect(page.getByRole('button', { name: 'Tạo lời mời', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Mời người thân', exact: true })).toHaveCount(0);
      expect(state.creates).toHaveLength(0);
    });
  },
  () => {
    test('TC-781: lỗi phát hành không có mã giả và không lộ nội dung nội bộ', async ({ page }) => {
      const state = await householdInvitationFixture(page);
      state.error = 'ERR_DELETION_PENDING';
      await page.goto('/family/invite');
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Nhà đang chờ xoá');
      await expect(page.getByLabel('Mã mời', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Chi tiết nội bộ', { exact: false })).toHaveCount(0);
    });
  },
  () => {
    test('Stitch: menu mở màn mời, 360px/chữ 200% không tràn ngang', async ({ page }) => {
      await householdInvitationFixture(page);
      await page.goto('/family/invite');
      await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'Tài khoản', exact: true })
        .getByRole('link', { name: 'Mời người thân', exact: true })
        .click();
      await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toHaveCount(0);
      await page.setViewportSize({ width: 360, height: 780 });
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      await page.getByRole('radio', { name: /Thành viên/ }).check();
      await page.getByRole('button', { name: 'Tạo lời mời', exact: true }).click();
      await expect(page.getByLabel('Mã mời', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  },
];
