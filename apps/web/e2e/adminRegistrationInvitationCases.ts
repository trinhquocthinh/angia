import { expect, test, type Page } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export function adminRegistrationInvitationCases() {
  test('SPEC-065: nhiều lời mời, sao chép, thu hồi, bí mật không lưu, mobile không tràn', async ({
    page,
  }) => {
    const state = await householdStartFixture(page);
    state.admin = true;
    await mockClipboard(page);
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Lời mời lập nhà', exact: true });
    await card.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true }).click();
    await expect(card.getByText('AN-REAL-1', { exact: true })).toBeVisible();
    await expect(card.getByLabel('Link lời mời lập nhà')).toHaveValue('https://angia.test/invite#secret-1');
    await expect(card.getByText('Hết hạn 02/12/2026')).toBeVisible();
    await card.getByRole('button', { name: 'Sao chép link' }).click();
    await expect(card.getByRole('status')).toHaveText('Đã sao chép');
    expect(await page.evaluate(() => Object.getOwnPropertyDescriptor(window, '__copied')?.value)).toBe(
      'https://angia.test/invite#secret-1',
    );
    await card.getByRole('button', { name: 'Sao chép mã' }).click();
    await expect
      .poll(() => page.evaluate(() => Object.getOwnPropertyDescriptor(window, '__copied')?.value))
      .toBe('AN-REAL-1');
    await card.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true }).click();
    await expect(card.getByText('AN-REAL-2', { exact: true })).toBeVisible();
    const revoke = card.getByRole('button', { name: 'Thu hồi', exact: true }).first();
    await revoke.focus();
    await revoke.press('Enter');
    await page.keyboard.press('Escape');
    await expect(revoke).toBeFocused();
    expect(state.registrationWrites.filter((write) => write.method === 'DELETE')).toHaveLength(0);
    await revoke.press('Enter');
    await page.getByRole('dialog').getByRole('button', { name: 'Huỷ' }).click();
    await expect(revoke).toBeFocused();
    expect(state.registrationWrites.filter((write) => write.method === 'DELETE')).toHaveLength(0);
    await revoke.press('Enter');
    await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận' }).click();
    await expect(card.getByText('AN-REAL-1', { exact: true })).toHaveCount(0);
    await expect(card.getByText('AN-REAL-2', { exact: true })).toBeVisible();
    await expectPrivateSession(page, logs);
    expect(state.registrationWrites[0]).toMatchObject({
      method: 'POST',
      body: { kind: 'found_family' },
      csrf: 'csrf',
    });
    expect(state.registrationWrites.at(-1)).toMatchObject({
      method: 'DELETE',
      path: '/api/admin/founding-invitations/invitation-1',
      csrf: 'csrf',
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tạo lời mời lập nhà', exact: true })).toBeVisible();
    await expect(page.getByText('AN-REAL-2', { exact: true })).toHaveCount(0);
  });
}

async function mockClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          Object.defineProperty(window, '__copied', { configurable: true, value });
        },
      },
    });
  });
}

async function expectPrivateSession(page: Page, logs: string[]) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(
    await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)])),
  ).not.toMatch(/AN-REAL|secret-/);
  expect(page.url()).not.toContain('secret-');
  expect(logs.join(' ')).not.toMatch(/AN-REAL|secret-/);
}
