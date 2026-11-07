import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
const first = {
  id: '00000000-0000-4000-8000-000000000010',
  level: 6,
  recordedAt: '2026-11-05T18:30:00Z',
  note: 'Lần cũ',
  createdBy: { accountId: issue.id, displayName: 'M' },
  updatedBy: { accountId: '00000000-0000-4000-8000-000000000002', displayName: 'Thịnh' },
  updatedAt: issue.updatedAt,
};
const second = {
  ...first,
  id: '00000000-0000-4000-8000-000000000011',
  recordedAt: issue.updatedAt,
  note: 'Lần mới',
  createdBy: null,
  updatedBy: null,
};
const initial = {
  ...issue,
  entryCount: 2,
  entries: [first, second],
  exercises: [],
  statusEvents: [{ kind: 'reopened', on: '2026-11-05', by: null, at: issue.updatedAt }],
};
test.beforeEach(async ({ page }) => {
  const detail = structuredClone(initial);
  await page.route('**/api/**/pain-issues/**', async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname.endsWith('/context')) {
      const params = new URL(request.url()).searchParams;
      await route.fulfill({
        json: { from: params.get('from'), to: params.get('to'), asNeededDoses: [], courses: [] },
      });
    } else if (request.method() === 'PATCH') {
      const body = request.postDataJSON();
      const found = detail.entries.find((entry) => request.url().endsWith(entry.id))!;
      Object.assign(found, body, { note: body.note || null });
      await route.fulfill({ json: found });
    } else if (request.method() === 'DELETE') {
      detail.entries = detail.entries.filter((entry) => !request.url().endsWith(entry.id));
      detail.entryCount = detail.entries.length;
      await route.fulfill({ status: 204 });
    } else if (request.method() === 'POST') {
      const body = request.postDataJSON();
      const entry = { ...second, ...body, id: '00000000-0000-4000-8000-000000000012' };
      detail.entries.push(entry);
      detail.entryCount++;
      await route.fulfill({ status: 201, json: entry });
    } else await route.fulfill({ json: detail });
  });
  await page.goto('/e2e/painIssueDetail.html');
});
test('TC-726 — người ghi/sửa, giờ Việt Nam, thứ tự, lịch sử và ghi nhanh tại chỗ', async ({ page }) => {
  const list = page.getByRole('region', { name: 'Các lần ghi' });
  await expect(list.getByRole('listitem').first()).toContainText('Lần mới');
  await expect(list).toContainText('Ghi bởi M · sửa bởi Thịnh');
  await expect(list).toContainText('Ghi bởi Tài khoản đã xóa');
  await expect(list).toContainText('06/11/2026 · 01:30');
  await expect(page.getByRole('region', { name: 'Lịch sử trạng thái' })).toContainText(
    'Mở lại · 05/11/2026 · Ghi bởi Tài khoản đã xóa',
  );
  const quick = page.getByRole('region', { name: 'Ghi nhanh', exact: true });
  await expect(quick.getByRole('radio', { checked: true })).toHaveCount(0);
  await quick.getByRole('radio', { name: '4', exact: true }).check();
  await quick.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(quick.getByRole('radio', { checked: true })).toHaveCount(0);
});
test('sửa mức/giờ/ghi chú, xóa trắng ghi chú và trả focus', async ({ page }) => {
  const open = page.getByRole('button', { name: 'Sửa lần ghi' }).last();
  await open.focus();
  await open.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Thời điểm (giờ Việt Nam)')).toHaveValue('2026-11-06T01:30');
  await dialog.getByRole('radio', { name: '4', exact: true }).check();
  await dialog.getByLabel('Ghi chú (tùy chọn)').fill('');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Các lần ghi' })).not.toContainText('Lần cũ');
  await expect(open).toBeFocused();
});
test('xóa cần xác nhận, lần ghi cuối ẩn nút xóa', async ({ page }) => {
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  await page.getByRole('button', { name: 'Xóa lần ghi', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Các lần ghi' }).getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: 'Xác nhận xóa lần ghi' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa lần ghi' }).click();
  await expect(page.getByRole('button', { name: 'Xóa lần ghi', exact: true })).toHaveCount(0);
  await expect(page.getByText('Đây là lần ghi duy nhất. Muốn bỏ hẳn, hãy xóa vấn đề.')).toBeVisible();
});
test('422 last_entry giữ bản nháp và ẩn xóa sau khi tải lại', async ({ page }) => {
  await page.route('**/entries/*', (route) =>
    route.fulfill({
      status: 422,
      json: { error: { code: 'ERR_VALIDATION', message: 'Lần ghi cuối', details: { reason: 'last_entry' } } },
    }),
  );
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ghi chú (tùy chọn)').fill('Bản nháp');
  await dialog.getByRole('button', { name: 'Xóa lần ghi', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận xóa lần ghi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Đây là lần ghi duy nhất');
  await expect(dialog.getByLabel('Ghi chú (tùy chọn)')).toHaveValue('Bản nháp');
  await expect(dialog.getByRole('button', { name: 'Xác nhận xóa lần ghi' })).toHaveCount(0);
});
test('đã khỏi ẩn ghi nhanh, vẫn sửa/xóa; chặn giờ sau ngày khỏi', async ({ page }) => {
  await page.route(`**/pain-issues/${issue.id}`, (route) =>
    route.fulfill({
      json: {
        ...initial,
        status: 'resolved',
        resolvedOn: '2026-11-06',
      },
    }),
  );
  await page.reload();
  await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  await page.getByRole('dialog').getByLabel('Thời điểm (giờ Việt Nam)').fill('2026-11-07T00:00');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('sau ngày đã khỏi');
  await expect(page.getByRole('button', { name: 'Xóa lần ghi', exact: true })).toBeVisible();
});
test('lỗi mạng giữ bản nháp và cho thử lại', async ({ page }) => {
  await page.route('**/entries/*', (route) => route.abort());
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ghi chú (tùy chọn)').fill('Giữ lại');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Không thể cập nhật lần ghi. Vui lòng thử lại.');
  await expect(dialog.getByLabel('Ghi chú (tùy chọn)')).toHaveValue('Giữ lại');
  await expect(dialog.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled();
});
test('404 về danh sách; lỗi đọc khác cho thử lại', async ({ page }) => {
  await page.route(`**/pain-issues/${issue.id}`, (route) => route.fulfill({ status: 500, json: {} }));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await page.route(`**/pain-issues/${issue.id}`, (route) =>
    route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy' } } }),
  );
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByText('Đã về danh sách')).toBeVisible();
});
test('self dùng endpoint phiên; đổi tài khoản đóng sheet và bỏ bản nháp', async ({ page }) => {
  await page.getByRole('button', { name: 'Dùng self' }).click();
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  const sent = page.waitForRequest((r) => r.method() === 'PATCH');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  expect((await sent).url()).toContain('/api/me/profile/pain-issues/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  await page.getByRole('dialog').getByLabel('Ghi chú (tùy chọn)').fill('Bản nháp cũ');
  await page.getByRole('button', { name: 'Đổi tài khoản' }).evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mất đồng thuận hủy lần sửa đang gửi và bỏ phản hồi muộn', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/entries/*', async (route) => {
    await gate;
    await route.fulfill({ json: second }).catch(() => undefined);
  });
  await page.getByRole('button', { name: 'Sửa lần ghi' }).first().click();
  const sent = page.waitForRequest((request) => request.method() === 'PATCH');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await sent;
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true })).toBeDisabled();
  await page
    .getByRole('button', { name: 'Rút đồng thuận' })
    .evaluate((button: HTMLButtonElement) => button.click());
  release();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Các lần ghi' })).toHaveCount(0);
  await expect(page.getByText('Đã sửa lần ghi.')).toHaveCount(0);
});
