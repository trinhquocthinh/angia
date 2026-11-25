import { expect, test } from '@playwright/test';
import { ADULT_PROFILE_ID, MINOR_PROFILE_ID, profileGuardiansFixture } from './profileGuardiansFixture.js';

const sections = [
  ['Thuốc đang dùng', '/medications'],
  ['Nhắc thuốc', '/reminders'],
  ['Diễn biến sức khỏe', '?section=health'],
  ['Kết quả xét nghiệm', '/lab-results'],
  ['Sổ đau nhức', '/pain'],
  ['Dòng thời gian', '/timeline'],
  ['Lịch tái khám', '/revisits'],
  ['Giấy tờ khám', '/documents'],
  ['Chuỗi đơn thuốc', '/prescriptions'],
  ['Nhập tay trực tiếp', '/manual'],
] as const;

test('SPEC-081 — mục lục mở từng mục và giữ hiển thị theo tuổi', async ({ page }) => {
  await profileGuardiansFixture(page);
  for (const [label, suffix] of sections) {
    await page.goto(`/profiles/${ADULT_PROFILE_ID}`);
    const directory = page.getByRole('navigation', { name: 'Mục lục sức khỏe', exact: true });
    await expect(directory).toBeVisible();
    await expect(directory.getByRole('link', { name: 'Người giám hộ' })).toHaveCount(0);
    await directory.getByRole('link', { name: label, exact: false }).click();
    await expect(page).toHaveURL(new RegExp(`/profiles/${ADULT_PROFILE_ID}${suffix.replace('?', '\\?')}/?$`));
    await expect(directory).toHaveCount(0);
    await expect(page.locator('main').last()).not.toBeEmpty();
  }
  await page.goto(`/profiles/${MINOR_PROFILE_ID}`);
  const directory = page.getByRole('navigation', { name: 'Mục lục sức khỏe', exact: true });
  await expect(directory.getByRole('link', { name: 'Diễn biến sức khỏe' })).toHaveCount(0);
  await directory.getByRole('link', { name: 'Người giám hộ' }).click();
  await expect(page.getByRole('heading', { name: 'Người giám hộ', exact: true })).toBeVisible();
});

test('SPEC-081 — danh sách và mục lục không tràn ngang ở hai nền và hai cỡ chữ', async ({
  page,
}, testInfo) => {
  await profileGuardiansFixture(page);
  for (const theme of ['light', 'dark']) {
    for (const large of [false, true]) {
      await page.addInitScript(
        ({ theme, large }) => {
          localStorage.setItem('angia-theme', theme);
          localStorage.setItem('angia-large-text', String(large));
        },
        { theme, large },
      );
      await page.goto('/?view=profiles');
      await expect(page.getByRole('heading', { name: 'Hồ sơ gia đình', exact: true })).toBeVisible();
      if (theme === 'light' && !large)
        await page.screenshot({ path: testInfo.outputPath('profiles-list.png'), fullPage: true });
      await page
        .getByRole('link', { name: /Xem hồ sơ chi tiết/ })
        .first()
        .click();
      await expect(page.getByRole('heading', { name: 'Mục lục sức khỏe', exact: true })).toBeVisible();
      if (theme === 'light' && !large)
        await page.screenshot({ path: testInfo.outputPath('profile-directory.png'), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});
