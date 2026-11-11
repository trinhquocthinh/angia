import { expect, test } from '@playwright/test';
import { todayFixture } from './todayFixture.js';

for (const theme of ['light', 'dark']) {
  test(`TC-852/853/854: mở trang đầu, xác nhận và hủy ở 360 px — ${theme}`, async ({ page }) => {
    const state = await todayFixture(page);
    await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Liều hôm nay', exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(2);
    const button = page.getByRole('button', { name: 'Đã dùng', exact: true }).first();
    const size = await button.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      font: parseFloat(getComputedStyle(element).fontSize),
    }));
    expect(size.width).toBeGreaterThanOrEqual(48);
    expect(size.height).toBeGreaterThanOrEqual(56);
    expect(size.font).toBeGreaterThanOrEqual(20);
    const background = await page
      .locator('.angia-card')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await button.click();
    await expect(page.getByText('Đã dùng · Mẹ · 07:32', { exact: true })).toBeVisible();
    expect(
      await page
        .locator('.angia-card')
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe(background);
    expect(state.writes).toEqual([{ method: 'POST', csrf: 'csrf' }]);
    await page.getByRole('button', { name: 'Hủy xác nhận' }).click();
    await expect(page.getByRole('button', { name: 'Đã dùng', exact: true })).toHaveCount(2);
    expect(state.writes[1]).toEqual({ method: 'DELETE', csrf: 'csrf' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('TC-855: member withdrawn không gọi API liều và có hướng dẫn đồng ý lại', async ({ page }) => {
  const state = await todayFixture(page);
  state.consentStatus = 'withdrawn';
  await page.goto('/');
  await expect(page.getByText(/Hồ sơ đã rút đồng thuận/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quản lý liên kết hồ sơ' })).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Đã dùng', exact: true })).toHaveCount(0);
  expect(state.reads).toEqual([]);
});

test('TC-852/855: main chuyển hồ sơ, rỗng, withdrawn và quay lại hồ sơ gia đình', async ({ page }) => {
  const state = await todayFixture(page, 'main');
  state.profiles[1]!.consentStatus = 'withdrawn';
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Ba', exact: true }).click();
  await expect(page.getByText(/Hồ sơ đã rút đồng thuận/)).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  expect(state.reads.some((path) => path.includes(state.profiles[1]!.id))).toBe(false);
  await page.getByRole('button', { name: 'Mẹ', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('link', { name: 'Hồ sơ gia đình', exact: true }).click();
  await expect(page).toHaveURL(/view=profiles/);
  await expect(page.getByRole('link', { name: 'Hôm nay', exact: true })).toBeVisible();
});

test('TC-852: main chưa liên kết chọn hồ sơ, không tự chọn người khác', async ({ page }) => {
  const state = await todayFixture(page, 'main');
  state.session.account.healthProfileId = null;
  await page.goto('/');
  await expect(page.getByText('Chọn hồ sơ để xem liều hôm nay.')).toBeVisible();
  expect(state.reads).toEqual([]);
  await page.getByRole('button', { name: 'Ba', exact: true }).click();
  await expect(page.getByText('Hôm nay không có liều nào.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Xem thuốc đang dùng' })).toHaveAttribute(
    'href',
    /medications/,
  );
});

test('TC-852: lỗi đọc có thử lại và phục hồi', async ({ page }) => {
  const state = await todayFixture(page);
  state.readError = true;
  await page.goto('/');
  await expect(page.getByText('Không thể tải liều hôm nay.')).toBeVisible();
  state.readError = false;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
});

test('TC-853: lỗi ghi giữ nút và thử lại đúng thao tác', async ({ page }) => {
  const state = await todayFixture(page);
  state.writeError = true;
  await page.goto('/');
  await page.getByRole('button', { name: 'Đã dùng', exact: true }).first().click();
  await expect(page.getByRole('alert')).toContainText('Không thể cập nhật');
  state.writeError = false;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByText('Đã dùng · Mẹ · 07:32', { exact: true })).toBeVisible();
});

test('TC-852/853: đang tải, khóa gửi lặp và chỉ hiện người sau đọc lại máy chủ', async ({ page }) => {
  const state = await todayFixture(page);
  let releaseRead!: () => void;
  const readGate = new Promise<void>((resolve) => {
    releaseRead = resolve;
  });
  await page.route('**/api/me/profile/reminders', async (route) => {
    await readGate;
    await route.fallback();
  });
  await page.goto('/');
  await expect(page.getByText('Đang tải liều hôm nay…')).toBeVisible();
  releaseRead();
  const button = page.getByRole('button', { name: 'Đã dùng', exact: true }).first();
  await expect(button).toBeVisible();
  let releaseWrite!: () => void;
  const writeGate = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });
  await page.route('**/api/reminders/*/dose-confirmation', async (route) => {
    await writeGate;
    await route.fallback();
  });
  await button.click();
  await expect(page.getByRole('button', { name: 'Đang xác nhận…' })).toBeDisabled();
  await expect(page.getByText('Đã dùng · Mẹ · 07:32', { exact: true })).toHaveCount(0);
  releaseWrite();
  await expect(page.getByText('Đã dùng · Mẹ · 07:32', { exact: true })).toBeVisible();
  expect(state.writes).toHaveLength(1);
});
