import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
const initial = {
  ...issue,
  entryCount: 5,
  exerciseCount: 2,
  entries: [
    {
      id: issue.id,
      level: 6,
      recordedAt: issue.lastEntry.recordedAt,
      note: null,
      createdBy: null,
      updatedBy: null,
      updatedAt: issue.updatedAt,
    },
  ],
  exercises: [],
  statusEvents: [],
};
test.beforeEach(async ({ page }) => {
  const detail = structuredClone(initial);
  await page.route('**/api/**/pain-issues/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/context')) {
      const q = new URL(route.request().url()).searchParams;
      return route.fulfill({
        json: { from: q.get('from'), to: q.get('to'), asNeededDoses: [], courses: [] },
      });
    }
    if (path.endsWith('/deletion-impact'))
      return route.fulfill({ json: { entryCount: 5, exerciseCount: 2 } });
    if (path.endsWith('/resolve'))
      return route.fulfill({
        json: { ...issue, status: 'resolved', resolvedOn: route.request().postDataJSON().resolvedOn },
      });
    if (route.request().method() === 'DELETE') return route.fulfill({ status: 204 });
    return route.fulfill({ json: detail });
  });
  await page.goto('/e2e/painIssueDetail.html');
});
test('TC-727: nêu tác động, hủy không xóa, chỉ DELETE sau xác nhận rồi về danh sách', async ({ page }) => {
  const sent: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'DELETE') sent.push(r.postData()!);
  });
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('5 lần ghi và 2 bài tập');
  await dialog.getByRole('button', { name: 'Giữ lại' }).click();
  expect(sent).toEqual([]);
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  await expect(page.getByText('Đã về danh sách')).toBeVisible();
  expect(sent.map((body) => JSON.parse(body))).toEqual([{ confirm: true }]);
});
test('TC-727: tác động tải lỗi khóa xóa, thử lại lấy số mới', async ({ page }) => {
  await page.route('**/deletion-impact', (r) => r.fulfill({ status: 500, json: {} }));
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('button', { name: 'Xóa vấn đề', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.route('**/deletion-impact', (r) => r.fulfill({ json: { entryCount: 7, exerciseCount: 3 } }));
  await dialog.getByRole('button', { name: 'Thử lại' }).click();
  await expect(dialog).toContainText('7 lần ghi và 3 bài tập');
  await expect(dialog.getByRole('button', { name: 'Xóa vấn đề', exact: true })).toBeEnabled();
});
test('TC-684/688: ngày khỏi theo giờ Việt Nam, đóng xong ẩn ghi nhanh và hiện lịch sử', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T03:00:00Z') });
  await page.route('**/resolve', async (route) => {
    const resolvedOn = route.request().postDataJSON().resolvedOn;
    const resolved = {
      ...initial,
      status: 'resolved',
      resolvedOn,
      statusEvents: [{ kind: 'resolved', on: resolvedOn, by: null, at: issue.updatedAt }],
    };
    await page.route(`**/pain-issues/${issue.id}`, (r) => r.fulfill({ json: resolved }));
    await route.fulfill({ json: { ...issue, status: 'resolved', resolvedOn } });
  });
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const input = dialog.getByLabel('Khỏi từ ngày *');
  await expect(input).toHaveValue('2026-11-07');
  await expect(input).toHaveAttribute('min', '2026-11-07');
  await expect(input).toHaveAttribute('max', '2026-11-07');
  await dialog.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Lịch sử trạng thái' })).toContainText(
    'Đã khỏi · 07/11/2026',
  );
});
test('TC-685: mở lại 409 có liên kết tới vấn đề đang theo dõi, không tự ghi', async ({ page }) => {
  const other = '00000000-0000-4000-8000-000000000009';
  await page.route(`**/pain-issues/${issue.id}`, (r) =>
    r.fulfill({ json: { ...initial, status: 'resolved', resolvedOn: '2026-11-07' } }),
  );
  await page.route('**/reopen', (r) =>
    r.fulfill({
      status: 409,
      json: {
        error: {
          code: 'ERR_PAIN_ISSUE_EXISTS',
          message: 'Trùng vùng',
          details: { existingIssueId: other },
        },
      },
    }),
  );
  await page.reload();
  const sent: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') sent.push(r.url());
  });
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Mở lại', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Mở lại', exact: true }).click();
  await expect(dialog).toContainText('Vùng này đang có một vấn đề khác đang theo dõi.');
  await page.route(`**/pain-issues/${other}`, (r) => r.fulfill({ json: { ...initial, id: other } }));
  await dialog.getByRole('link', { name: 'Mở vấn đề đó' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toBeVisible();
  expect(sent).toHaveLength(1);
  expect(sent[0]).toContain('/reopen');
});
test('TC-688: self mở lại chỉ sau xác nhận, dùng endpoint phiên và không tự ghi mức', async ({ page }) => {
  let reopened = false;
  const posts: string[] = [];
  await page.route(`**/pain-issues/${issue.id}`, (r) =>
    r.fulfill({ json: reopened ? initial : { ...initial, status: 'resolved', resolvedOn: '2026-11-07' } }),
  );
  await page.route('**/reopen', (r) => {
    posts.push(r.request().url());
    reopened = true;
    return r.fulfill({ json: issue });
  });
  await page.getByRole('button', { name: 'Dùng self' }).click();
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Mở lại', exact: true }).click();
  const dialog = page.getByRole('dialog');
  expect(posts).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Giữ nguyên' }).click();
  expect(posts).toHaveLength(0);
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Mở lại', exact: true }).click();
  await dialog.getByRole('button', { name: 'Mở lại', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain('/api/me/profile/pain-issues/');
});
test('mất đồng thuận khi đang xóa đóng dialog và bỏ phản hồi muộn', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await page.route(`**/pain-issues/${issue.id}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await gate;
      await route.fulfill({ status: 204 }).catch(() => undefined);
    } else await route.fulfill({ json: initial });
  });
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  const sent = page.waitForRequest((r) => r.method() === 'DELETE');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  await sent;
  await page.getByRole('button', { name: 'Rút đồng thuận' }).evaluate((b: HTMLButtonElement) => b.click());
  release();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Hồ sơ chưa được đồng ý lưu dữ liệu.')).toBeVisible();
  await expect(page.getByText('Đã về danh sách')).toHaveCount(0);
});

test('xóa lỗi giữ hộp xác nhận, thử lại được và không tự gửi lại', async ({ page }) => {
  let deletes = 0;
  await page.route(`**/pain-issues/${issue.id}`, (route) => {
    if (route.request().method() !== 'DELETE') return route.fulfill({ json: initial });
    deletes++;
    return deletes === 1 ? route.abort() : route.fulfill({ status: 204 });
  });
  await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
  await page.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Không thể cập nhật vấn đề đau. Vui lòng thử lại.');
  await expect(dialog).toContainText('5 lần ghi và 2 bài tập');
  expect(deletes).toBe(1);
  await dialog.getByRole('button', { name: 'Xóa vấn đề', exact: true }).click();
  await expect(page.getByText('Đã về danh sách')).toBeVisible();
  expect(deletes).toBe(2);
});
test('TC-684: lỗi ngày từ API giữ ngày đã chọn, Escape trả focus về nút mở', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-09T03:00:00Z') });
  await page.route('**/resolve', (route) =>
    route.fulfill({
      status: 422,
      json: { error: { code: 'ERR_VALIDATION', message: 'Ngày khỏi phải từ lần ghi muộn nhất.' } },
    }),
  );
  const trigger = page.getByRole('button', { name: 'Tùy chọn vấn đề' });
  await trigger.click();
  await page.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Khỏi từ ngày *').fill('2026-11-08');
  await dialog.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Ngày khỏi phải từ lần ghi muộn nhất.');
  await expect(dialog.getByLabel('Khỏi từ ngày *')).toHaveValue('2026-11-08');
  await dialog.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
