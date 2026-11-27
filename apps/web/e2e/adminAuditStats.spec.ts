import { expect, test } from '@playwright/test';
import { adminAuditStatsFixture, adminReadIds } from './adminAuditStatsFixture.js';
import { adminAuditStatsRecoveryCases } from './adminAuditStatsRecoveryCases.js';

for (const theme of ['light', 'dark']) {
  test.describe(`E31 nhật ký và thống kê — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    statsCase(theme);
    auditRowsCase();
    filtersCase();
    invalidFiltersCase();
    adminAuditStatsRecoveryCases();
  });
}
function statsCase(theme: string) {
  test('TC-844: bốn số đúng API, 12 tuần và không tràn ở 360 px', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Thống kê không định danh', exact: true });
    for (const [label, value] of [
      ['Tổng số nhà', '12'],
      ['Tài khoản hoạt động', '38'],
      ['Nhà có xác nhận liều tuần này', '7'],
      ['Nhà dùng đều từ 4 tuần', '3'],
    ]) {
      await expect(
        card
          .locator('dl > div')
          .filter({ has: page.getByText(label!, { exact: true }) })
          .locator('dd'),
      ).toHaveText(value!);
    }
    await expect(card.locator('tbody tr')).toHaveCount(12);
    await expect(card.locator('caption')).toHaveText('Số liệu theo tuần (thứ Hai – Chủ nhật, giờ Việt Nam)');
    await expect(card.getByRole('rowheader').first()).toHaveText('23/11/2026');
    await expect(card.getByText(/Lượt quét|Tỷ lệ lỗi/)).toHaveCount(0);
    expect(state.statsRequests[0]?.searchParams.get('weeks')).toBe('12');
    await expect(
      page
        .getByRole('article', { name: 'Nhật ký quản trị', exact: true })
        .getByRole('listitem')
        .getByText('Khoá tài khoản', { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const region = card.getByRole('region', { name: 'Bảng thống kê 12 tuần' });
    expect(await region.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await region.focus();
    await expect(region).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const audit = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    for (const button of await audit.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });
}
function auditRowsCase() {
  test('TC-841: nhãn, giờ Việt Nam, id rút gọn; tải thêm nối trang', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    await expect(card.locator('li')).toHaveCount(1);
    await expect(card.locator('li').first()).toContainText('27/11/2026 01:04 · Quản trị hệ thống');
    await expect(card.locator('li').first()).toContainText('Nhà 12345678');
    await expect(card.locator('li').first()).toContainText('Đối tượng: tài khoản 87654321');
    await expect(card.locator(`[title="${adminReadIds.family}"]`)).toHaveText('Nhà 12345678');
    await expect(card.getByText('NEVER_RENDER_METADATA')).toHaveCount(0);
    await card.getByRole('button', { name: 'Tải thêm' }).click();
    await expect(card.locator('li')).toHaveCount(2);
    await expect(card.locator('li').last()).toContainText('Tài khoản 87654321');
    await expect(card.locator('li').last()).toContainText('Đổi email');
    await expect(card.locator('li').last()).toContainText('hồ sơ 87654321');
    expect(state.auditRequests.at(-1)?.searchParams.get('cursor')).toBe('micro+cursor/==');
    await expect(card.getByRole('button', { name: 'Tải thêm' })).toHaveCount(0);
  });
}
function filtersCase() {
  test('TC-841: lọc ngày và mã, đổi lọc/xoá lọc bỏ cursor', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    await card.getByRole('button', { name: 'Tải thêm' }).click();
    await expect(card.locator('li')).toHaveCount(2);
    await card.getByLabel('Từ ngày').fill('2026-11-27');
    await card.getByLabel('Đến ngày').fill('2026-11-27');
    await card.getByLabel('Mã nhà').fill(adminReadIds.family);
    await card.getByLabel('Mã tài khoản').fill(adminReadIds.account);
    await card.getByLabel('Loại sự kiện').selectOption('account_locked');
    await card.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(card.locator('li')).toHaveCount(1);
    expect(Object.fromEntries(state.auditRequests.at(-1)!.searchParams)).toEqual({
      from: '2026-11-26T17:00:00.000Z',
      to: '2026-11-27T17:00:00.000Z',
      familyId: adminReadIds.family,
      accountId: adminReadIds.account,
      action: 'account_locked',
      limit: '50',
    });
    await card.getByRole('button', { name: 'Xoá lọc' }).click();
    await expect(card.getByLabel('Từ ngày')).toHaveValue('');
    await expect(card.getByLabel('Loại sự kiện')).toHaveValue('');
    await expect
      .poll(() => Object.fromEntries(state.auditRequests.at(-1)!.searchParams))
      .toEqual({ limit: '50' });
    await expect(card.locator('li')).toHaveCount(1);
  });
}
function invalidFiltersCase() {
  test('TC-841: UUID sai và khoảng ngày ngược hiện lỗi, không gọi API', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    await expect(card.locator('li')).toHaveCount(1);
    const count = state.auditRequests.length;
    await card.getByLabel('Mã nhà').fill('khong-phai-uuid');
    await card.getByLabel('Mã tài khoản').fill('sai');
    await card.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(card.getByText('Mã không hợp lệ.', { exact: true })).toHaveCount(2);
    expect(state.auditRequests).toHaveLength(count);
    await card.getByLabel('Mã nhà').fill('');
    await card.getByLabel('Mã tài khoản').fill('');
    await card.getByLabel('Từ ngày').fill('2026-11-28');
    await card.getByLabel('Đến ngày').fill('2026-11-27');
    await card.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(card.getByRole('status')).toHaveText('Khoảng ngày không hợp lệ.');
    expect(state.auditRequests).toHaveLength(count);
  });
}
