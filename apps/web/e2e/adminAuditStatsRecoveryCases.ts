import { expect, test } from '@playwright/test';
import { adminAuditStatsFixture } from './adminAuditStatsFixture.js';
export function adminAuditStatsRecoveryCases() {
  loadingCase();
  emptyAndErrorCase();
  nextPageErrorCase();
  nonAdminCase();
}
function loadingCase() {
  test('TC-841/844: thông báo đang tải trước khi có dữ liệu', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    state.statsHold = hold;
    state.auditHold = hold;
    try {
      await page.goto('/admin');
      await expect(page.getByText('Đang tải thống kê…')).toBeVisible();
      await expect(page.getByText('Đang tải nhật ký…')).toBeVisible();
    } finally {
      release();
    }
    await expect(
      page.getByRole('article', { name: 'Thống kê không định danh', exact: true }).locator('tbody tr'),
    ).toHaveCount(12);
  });
}
function emptyAndErrorCase() {
  test('TC-841/844: 422 là lỗi chung, thử lại khôi phục và lọc rỗng', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    state.statsStatus = 503;
    state.auditStatus = 422;
    await page.goto('/admin');
    const stats = page.getByRole('article', { name: 'Thống kê không định danh', exact: true });
    const audit = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    await expect(stats.getByRole('status')).toHaveText(/Không tải được thống kê. Thử lại./);
    await expect(audit.getByRole('status')).toHaveText(/Không tải được nhật ký. Thử lại./);
    state.statsStatus = 200;
    state.auditStatus = 200;
    state.empty = true;
    await stats.getByRole('button', { name: 'Thử lại' }).click();
    await audit.getByRole('button', { name: 'Thử lại' }).click();
    await expect(stats.locator('tbody tr')).toHaveCount(12);
    await expect(audit.getByRole('status')).toHaveText('Chưa có sự kiện nào khớp bộ lọc.');
    await expect(audit.getByRole('button', { name: 'Tải thêm' })).toHaveCount(0);
  });
}
function nextPageErrorCase() {
  test('TC-841: tải thêm lỗi giữ trang cũ, thử lại đúng cursor', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    state.nextPageError = true;
    await page.goto('/admin');
    const card = page.getByRole('article', { name: 'Nhật ký quản trị', exact: true });
    await card.getByRole('button', { name: 'Tải thêm' }).click();
    await expect(card.getByText('Không tải được nhật ký. Thử lại.', { exact: true })).toBeVisible();
    await expect(card.locator('li')).toHaveCount(1);
    state.nextPageError = false;
    await card.getByRole('button', { name: 'Thử lại' }).click();
    await expect(card.locator('li')).toHaveCount(2);
    expect(state.auditRequests.at(-1)?.searchParams.get('cursor')).toBe('micro+cursor/==');
  });
}
function nonAdminCase() {
  test('TC-841/844: thành viên không thấy thẻ và không gọi API quản trị', async ({ page }) => {
    const state = await adminAuditStatsFixture(page);
    state.session.admin = false;
    state.session.family = true;
    await page.goto('/admin');
    await expect(page.getByRole('article', { name: 'Thống kê không định danh', exact: true })).toHaveCount(0);
    await expect(page.getByRole('article', { name: 'Nhật ký quản trị', exact: true })).toHaveCount(0);
    expect(state.statsRequests).toHaveLength(0);
    expect(state.auditRequests).toHaveLength(0);
  });
}
