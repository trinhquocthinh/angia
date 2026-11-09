import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Wheel cần context desktop; các viewport hẹp vẫn kiểm bố cục responsive.
test.use({ isMobile: false, hasTouch: false });
async function open(page: Page) {
  await page.goto('/e2e/newPainIssue.html');
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.height = '3000px';
    document.body.append(el);
  });
  await page.getByRole('button', { name: 'Mở sheet' }).click();
}
test('nền modal không cuộn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 650 });
  await open(page);
  await page.mouse.move(10, 100);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
for (const width of [1440, 930, 768, 360]) {
  test(`footer không bị nhãn vùng phủ ở ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 650 });
    await open(page);
    await page.getByRole('button', { name: 'Cẳng tay · phải', exact: true }).click();
    const next = page.getByRole('button', { name: 'Tiếp tục', exact: true });
    const hit = await next.evaluate((button) => {
      const r = button.getBoundingClientRect();
      return Array.from(button.closest('dialog')!.querySelectorAll('button[aria-pressed]')).every(
        (region) => {
          const b = region.getBoundingClientRect();
          const l = Math.max(r.left, b.left),
            rr = Math.min(r.right, b.right),
            t = Math.max(r.top, b.top),
            bb = Math.min(r.bottom, b.bottom);
          return rr <= l || bb <= t || button.contains(document.elementFromPoint((l + rr) / 2, (t + bb) / 2));
        },
      );
    });
    expect(hit).toBe(true);
    await next.click();
    await expect(page.getByRole('heading', { name: 'Thêm vấn đề đau — Lần ghi đầu' })).toBeVisible();
  });
}

test('cuộn tới bàn chân và dòng đã chọn; footer vẫn bấm được', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 650 });
  await open(page);
  const foot = page.getByRole('button', { name: 'Bàn chân, ngón chân · phải', exact: true });
  await foot.click();
  const selected = page.getByText('Đã chọn: Bàn chân, ngón chân · phải', { exact: true });
  await selected.scrollIntoViewIfNeeded();
  await expect(selected).toBeVisible();
  const visible = await selected.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(visible).toBe(true);
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thêm vấn đề đau — Lần ghi đầu' })).toBeVisible();
});
test('đóng modal cuối mới mở khóa trang nền', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 650 });
  await open(page);
  await page.evaluate(() => {
    const d = document.createElement('dialog');
    d.id = 'second-modal';
    d.innerHTML = '<button>Modal thử</button>';
    document.body.append(d);
    d.showModal();
  });
  await page.evaluate(() => {
    (document.querySelector('#second-modal') as HTMLDialogElement).close();
  });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  await page.mouse.move(10, 100);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
});
test('giữ vị trí trang khi mở rồi đóng modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 650 });
  await page.goto('/e2e/newPainIssue.html');
  await page.evaluate(() => {
    document.body.style.minHeight = '3000px';
    const b = document.querySelector('button')!;
    b.style.position = 'fixed';
    b.style.top = '20px';
    window.scrollTo(0, 500);
  });
  await page.getByRole('button', { name: 'Mở sheet' }).click();
  expect(await page.evaluate(() => scrollY)).toBe(500);
  await page.mouse.move(10, 100);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(500);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  expect(await page.evaluate(() => scrollY)).toBe(500);
});
