import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
const entry = {
  id: issue.id,
  level: 6,
  recordedAt: issue.updatedAt,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
const exercise = {
  id: '00000000-0000-4000-8000-000000000020',
  name: 'Duỗi gối',
  source: 'prescribed',
  prescriber: 'BS. An',
  startDate: '2026-11-05',
  endDate: '2026-11-10',
  note: '3 hiệp × 10 lần',
  createdBy: { accountId: issue.id, displayName: 'M' },
  updatedBy: { accountId: '00000000-0000-4000-8000-000000000002', displayName: 'Thịnh' },
  updatedAt: issue.updatedAt,
};
test.beforeEach(async ({ page }) => {
  const detail = {
    ...issue,
    entryCount: 1,
    exercises: [{ ...exercise }],
    exerciseCount: 1,
    entries: [entry],
    statusEvents: [],
  };
  await page.route('**/api/**/pain-issues/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/context')) {
      const q = new URL(request.url()).searchParams;
      await route.fulfill({ json: { from: q.get('from'), to: q.get('to'), asNeededDoses: [], courses: [] } });
    } else if (request.method() === 'POST') {
      const body = request.postDataJSON();
      const added = {
        ...exercise,
        ...body,
        prescriber: body.prescriber ?? null,
        endDate: body.endDate ?? null,
        id: '00000000-0000-4000-8000-000000000021',
      };
      detail.exercises.push(added);
      detail.exerciseCount++;
      await route.fulfill({ status: 201, json: added });
    } else if (request.method() === 'PATCH') {
      const body = request.postDataJSON();
      Object.assign(detail.exercises[0]!, body, body.source === 'self' ? { prescriber: null } : {});
      await route.fulfill({ json: detail.exercises[0] });
    } else await route.fulfill({ json: detail });
  });
  await page.goto('/e2e/painIssueDetail.html');
});
test('TC-692/726: thẻ có nguồn chữ, ngày, ghi chú, người ghi/sửa; không có theo dõi tập', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Bài tập', exact: true });
  await expect(section).toContainText('Bác sĩ chỉ định · BS. An');
  await expect(section).toContainText('Từ 05/11/2026 đến 10/11/2026');
  await expect(section).toContainText('Ghi bởi M · sửa bởi Thịnh');
  await expect(section.getByRole('checkbox')).toHaveCount(0);
  await expect(section.getByText('Đã tập', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('TC-692/693: thêm không chọn sẵn nguồn, đổi self xóa người chỉ định, dữ liệu và focus đúng', async ({
  page,
}) => {
  const level = page
    .getByRole('region', { name: 'Ghi nhanh', exact: true })
    .getByRole('radio', { name: '4', exact: true });
  await level.check();
  const open = page.getByRole('button', { name: 'Thêm bài tập', exact: true });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(dialog.getByLabel('Ngày bắt đầu *', { exact: true })).toHaveValue(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
  );
  expect(
    await dialog
      .getByRole('button', { name: 'Thêm bài tập', exact: true })
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe('rgb(47, 111, 94)');
  await dialog.getByLabel('Tên bài tập *').fill('Đi bộ');
  await dialog.getByLabel('Bác sĩ, chuyên viên chỉ định', { exact: true }).check();
  await dialog.getByLabel('Người chỉ định (tùy chọn)').fill('Không giữ');
  await dialog.getByLabel('Tự ghi', { exact: true }).check();
  await expect(dialog.getByLabel('Người chỉ định (tùy chọn)')).toHaveCount(0);
  await dialog.getByLabel('Bác sĩ, chuyên viên chỉ định', { exact: true }).check();
  await expect(dialog.getByLabel('Người chỉ định (tùy chọn)')).toHaveValue('');
  await dialog.getByLabel('Tự ghi', { exact: true }).check();
  const sent = page.waitForRequest((r) => r.method() === 'POST');
  await dialog.getByRole('button', { name: 'Thêm bài tập', exact: true }).click();
  expect((await sent).postDataJSON()).not.toHaveProperty('prescriber');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Bài tập', exact: true })).toContainText('Đi bộ');
  await expect(open).toBeFocused();
  await expect(level).toBeChecked();
});
test('TC-694: sửa gửi null xóa ngày kết thúc và hiện Tự ghi', async ({ page }) => {
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Ngày kết thúc (tùy chọn)')).toHaveValue('2026-11-10');
  await dialog.getByLabel('Ngày kết thúc (tùy chọn)').fill('');
  await dialog.getByLabel('Tự ghi', { exact: true }).check();
  const sent = page.waitForRequest((r) => r.method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  expect((await sent).postDataJSON()).toMatchObject({ source: 'self', endDate: null });
  await expect(dialog).toHaveCount(0);
  const section = page.getByRole('region', { name: 'Bài tập', exact: true });
  await expect(section).not.toContainText('10/11/2026');
  await expect(section).not.toContainText('BS. An');
  await expect(section).toContainText('Tự ghi');
});
test('TC-695: đã khỏi vẫn thêm/sửa; rỗng có lời dẫn', async ({ page }) => {
  await page.route(`**/pain-issues/${issue.id}`, (route) =>
    route.fulfill({
      json: {
        ...issue,
        status: 'resolved',
        resolvedOn: '2026-11-07',
        entries: [entry],
        exercises: [],
        statusEvents: [],
      },
    }),
  );
  await page.reload();
  await expect(page.getByText('Chưa ghi bài tập nào.')).toBeVisible();
  await page.getByRole('button', { name: 'Thêm bài tập', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.route(`**/pain-issues/${issue.id}`, (route) =>
    route.fulfill({
      json: {
        ...issue,
        status: 'resolved',
        resolvedOn: '2026-11-07',
        entries: [entry],
        exercises: [exercise],
        statusEvents: [],
      },
    }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
test('TC-692/694: lỗi giữ bản nháp, thử lại và ngày kết thúc không trước bắt đầu', async ({ page }) => {
  await page.route('**/exercises/*', (route) => route.abort());
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ghi chú (số lần, số hiệp, tần suất…)').fill('Bản nháp');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Không thể lưu bài tập');
  await expect(dialog.getByLabel('Ghi chú (số lần, số hiệp, tần suất…)')).toHaveValue('Bản nháp');
  await dialog.getByLabel('Ngày kết thúc (tùy chọn)').fill('2026-11-04');
  expect(
    await dialog
      .getByLabel('Ngày kết thúc (tùy chọn)')
      .evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow),
  ).toBe(true);
  await dialog.getByLabel('Ngày kết thúc (tùy chọn)').fill('');
  await page.unroute('**/exercises/*');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
});
test('TC-692: self gửi endpoint phiên; đổi tài khoản đóng bản nháp', async ({ page }) => {
  await page.getByRole('button', { name: 'Dùng self' }).click();
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối' }).click();
  const sent = page.waitForRequest((r) => r.method() === 'PATCH');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  expect((await sent).url()).toContain('/api/me/profile/pain-issues/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối' }).click();
  await page.getByRole('button', { name: 'Đổi tài khoản' }).evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('TC-692: mất đồng thuận hủy lưu, khóa gửi trùng và bỏ phản hồi muộn', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  let writes = 0;
  await page.route('**/exercises/*', async (route) => {
    writes++;
    await gate;
    await route.fulfill({ json: exercise }).catch(() => undefined);
  });
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối' }).click();
  const sent = page.waitForRequest((r) => r.method() === 'PATCH');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await sent;
  await expect(page.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Rút đồng thuận' }).evaluate((b: HTMLButtonElement) => b.click());
  release();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Bài tập', exact: true })).toHaveCount(0);
  await expect(page.getByText('Đã sửa bài tập.')).toHaveCount(0);
  expect(writes).toBe(1);
});

test('sheet dài cho cuộn ô ghi chú vào vùng nhìn thấy phía trên nút lưu ở 360 px', async ({ page }) => {
  await page.getByRole('button', { name: 'Sửa bài tập Duỗi gối', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const note = dialog.getByLabel('Ghi chú (số lần, số hiệp, tần suất…)');
  await note.scrollIntoViewIfNeeded();
  const noteBox = await note.boundingBox();
  const footerBox = await dialog.locator('footer').boundingBox();
  // Chromium có thể làm tròn viền ô nhập lệch một pixel sau khi cuộn.
  expect(noteBox!.y + noteBox!.height).toBeLessThanOrEqual(footerBox!.y + 1);
  await note.click({ position: { x: 20, y: 70 } });
  await note.fill('Ghi chú khi cuộn');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Bài tập', exact: true })).toContainText('Ghi chú khi cuộn');
});
