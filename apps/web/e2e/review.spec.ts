import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { reviewFixture, REVIEW_ID } from './reviewFixture.js';

test('SPEC-081 — desktop đặt hàng chờ trên ảnh, form bên phải', async ({ page }) => {
  await reviewFixture(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/review/${REVIEW_ID}`);
  const queue = page.getByRole('region', { name: 'Chờ xác nhận' });
  const image = page.getByRole('region', { name: 'Hình chụp giấy tờ' });
  await expect(page.getByLabel('Nơi khám', { exact: true })).toHaveValue('Cơ sở khám mẫu');
  const q = (await queue.boundingBox())!;
  const i = (await image.boundingBox())!;
  const f = (await page.getByLabel('Nơi khám', { exact: true }).boundingBox())!;
  expect(Math.abs(q.x - i.x)).toBeLessThan(4);
  expect(i.y).toBeGreaterThanOrEqual(q.y + q.height);
  expect(f.x).toBeGreaterThan(i.x + i.width);
  await page.getByRole('button', { name: 'Thêm thuốc', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm thuốc', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 900));
  const sticky = (await image.boundingBox())!;
  expect(sticky.y).toBeGreaterThanOrEqual(96);
  expect(sticky.y).toBeLessThanOrEqual(130);
});

for (const width of [360, 768, 1024, 1440]) {
  test(`SPEC-081 — review ${width}px ở hai nền và hai cỡ chữ`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await reviewFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      for (const large of [false, true]) {
        await page.addInitScript(
          ({ theme, large }) => {
            localStorage.setItem('angia-theme', theme);
            localStorage.setItem('angia-large-text', String(large));
          },
          { theme, large },
        );
        await page.goto(`/review/${REVIEW_ID}`);
        await expect(page.getByLabel('Tên thuốc *', { exact: true })).toHaveValue('Thuốc mẫu');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const image = page.getByRole('region', { name: 'Hình chụp giấy tờ' });
        await expect(image).toContainText('Đây là bản đã che.');
        if (width === 360) {
          await expect(page.getByRole('region', { name: 'Chờ xác nhận' })).toBeHidden();
          const results = await new AxeBuilder({ page }).include('.review-page').analyze();
          expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
            [],
          );
        }
        if (theme === 'light' && !large)
          await page.screenshot({ path: info.outputPath(`review-${width}.png`), fullPage: true });
      }
    }
  });
}

test('SPEC-081 — danh sách tải thêm, lỗi thử lại và trạng thái rỗng', async ({ page }) => {
  const state = await reviewFixture(page);
  state.more = true;
  await page.goto('/review');
  await page.getByRole('button', { name: /Xem thêm/ }).click();
  await expect(page.getByRole('region', { name: 'Chờ xác nhận' }).getByRole('link')).toHaveCount(2);
  state.error = true;
  await page.reload();
  await expect(page.getByText('Không tải được danh sách chờ kiểm tra.')).toBeVisible();
  state.error = false;
  state.more = false;
  state.documents = [];
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Không còn giấy tờ nào chờ kiểm tra.')).toBeVisible();
});

test('SPEC-081 — tên hồ sơ dài và chữ 200% không làm tràn danh sách hoặc chi tiết', async ({ page }) => {
  const state = await reviewFixture(page);
  state.profile.displayName = 'Hồ sơ gia đình có tên rất dài để đối chiếu giấy tờ trên điện thoại';
  await page.setViewportSize({ width: 360, height: 900 });
  await page.addInitScript(() => {
    document.documentElement.style.fontSize = '200%';
  });
  for (const path of ['/review', `/review/${REVIEW_ID}`]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('SPEC-011 — hết lượt vẫn mở được form nhập tay trong review', async ({ page }) => {
  const state = await reviewFixture(page);
  state.document.status = 'awaiting_budget';
  await page.goto(`/review/${REVIEW_ID}`);
  await expect(page.getByText(/Bạn có thể nhập tay ngay theo ảnh mà không cần chờ/)).toBeVisible();
  await expect(page.getByLabel('Tên thuốc *', { exact: true })).toBeEditable();
  await expect(page.getByRole('button', { name: 'Lưu vào sổ', exact: true })).toBeEnabled();
});

test('SPEC-010 — lưu đơn vẫn giữ dữ liệu, CSRF và về hàng chờ khi hết giấy tờ', async ({ page }) => {
  const state = await reviewFixture(page);
  await page.goto(`/review/${REVIEW_ID}`);
  await expect(page.getByLabel('Tên thuốc *', { exact: true })).toHaveValue('Thuốc mẫu');
  await page.getByRole('button', { name: 'Lưu vào sổ', exact: true }).click();
  await expect(page).toHaveURL(/\/review$/);
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0]).toMatchObject({
    csrf: 'csrf',
    body: {
      type: 'prescription',
      data: {
        issuedDate: '2026-11-26',
        facility: 'Cơ sở khám mẫu',
        items: [{ name: 'Thuốc mẫu', quantityPerDose: 1, slots: ['morning'], longTerm: true }],
      },
    },
  });
});
