import { deflateSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { reviewFixture } from './reviewFixture.js';

const USAGE = {
  storage: { usedBytes: 1288490188, limitBytes: 2 * 1024 ** 3 },
  dailyUploads: { used: 3, limit: 100, resetsAt: '2026-11-27T00:00:00+07:00' },
  pendingJobs: { used: 1, limit: 10 },
  aiOcr: { month: '2026-11', usedPercent: 15, anyUsed: true, exhausted: false },
};

const SCAN_QUOTA = {
  month: '2026-11',
  status: 'approved',
  grantedScans: 20,
  usedScans: 3,
  heldScans: 0,
  remainingScans: 17,
  runtimeActive: true,
};

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  chunk.set(data, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  return chunk;
}

function samplePng(width = 64, height = 48) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((1 + width * 3) * height, 240);
  for (let y = 0; y < height; y += 1) raw[y * (1 + width * 3)] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function setupPrivacyFixture(page: Page) {
  const state = await reviewFixture(page);
  await page.route('**/api/family/usage', (route) => route.fulfill({ json: USAGE }));
  await page.route('**/api/family/scan-quota', (route) => route.fulfill({ json: SCAN_QUOTA }));
  return state;
}

async function openRedactionStudio(page: Page) {
  await page.goto('/upload');
  await page.getByRole('button', { name: 'Tôi đã hiểu', exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'don-thuoc-mau.png',
    mimeType: 'image/png',
    buffer: samplePng(),
  });
  await page.getByRole('button', { name: /Che thông tin/ }).click();
  await expect(page.getByRole('heading', { name: 'Cắt và che thông tin định danh' })).toBeVisible();
}

test('SPEC-081 — trình che thông tin và nắn giấy dùng được ở 360px (Light/Dark, Chuẩn/Chữ lớn)', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await setupPrivacyFixture(page);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const theme of ['light', 'dark']) {
    for (const large of [false, true]) {
      await page.addInitScript(
        ({ theme, large }) => {
          localStorage.setItem('angia-theme', theme);
          localStorage.setItem('angia-large-text', String(large));
        },
        { theme, large },
      );
      await openRedactionStudio(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Xoay 90°', exact: true }).click();
      await page.getByRole('button', { name: 'Thêm vùng che', exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Nắn giấy', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Nắn 4 góc giấy tờ' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Huỷ', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Cắt và che thông tin định danh' })).toBeVisible();
      if (theme === 'light' && !large) {
        const editAxe = await new AxeBuilder({ page })
          .include('section[aria-label^="Che thông tin ảnh"]')
          .analyze();
        expect(editAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
          [],
        );
        await page.screenshot({ path: info.outputPath('privacy-studio-360.png'), fullPage: true });
      }
      await page.getByRole('button', { name: 'Xem bản sẽ tải lên', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Xem bản sẽ tải lên' })).toBeVisible();
      await expect(page.getByText('Đã che 1 vùng')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByLabel('Tôi tự nhập').check();
      await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Cắt và che thông tin định danh' })).toBeHidden();
    }
  }
});

for (const width of [360, 1440]) {
  test(`SPEC-081 — trang nhập tay ${width}px không tràn và đạt A11y`, async ({ page }, info) => {
    test.setTimeout(90_000);
    const state = await setupPrivacyFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => {
        localStorage.setItem('angia-theme', t);
      }, theme);
      await page.goto(`/profiles/${state.profile.id}/manual`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Nhập tay cho');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: /Đơn thuốc/ }).click();
      await expect(page.getByLabel('Tên thuốc *', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: /Xét nghiệm/ }).click();
      await expect(page.getByLabel('Tên chỉ số *', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (theme === 'light') {
        const axe = await new AxeBuilder({ page }).include('main').exclude('.account-menu-trigger').analyze();
        expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
        await page.screenshot({ path: info.outputPath(`manual-${width}.png`), fullPage: true });
      }
    }
  });
}
