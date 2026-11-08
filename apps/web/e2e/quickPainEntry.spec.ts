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
const detail = { ...issue, entries: [entry], exercises: [], statusEvents: [] };
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**/pain-issues**', async (route) => {
    if (route.request().method() === 'GET')
      await route.fulfill({
        json: new URL(route.request().url()).pathname.endsWith(issue.id) ? detail : { issues: [issue] },
      });
    else await route.fulfill({ status: 201, json: entry });
  });
  await page.goto('/e2e/quickPainEntry.html');
});
test('TC-723 — bốn chạm: tab, ghi mức, chọn mức, lưu; không chọn sẵn và giờ mặc định', async ({ page }) => {
  const requests: unknown[] = [];
  await page.route('**/entries', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, json: entry });
  });
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).tap();
  await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Hướng dẫn chọn mức đau' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Mức đau lúc này' })).toHaveAccessibleDescription(
    /1–3.*Đau nhẹ.*4–6.*Đau trung bình.*7–10.*Đau nặng/,
  );
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  await expect(page.getByText('Thời điểm: Bây giờ ·')).toBeVisible();
  await page.getByRole('radio', { name: '6', exact: true }).tap();
  await page.getByRole('button', { name: 'Lưu', exact: true }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Đã ghi 6/10 cho Đầu gối · trái.');
  expect(requests).toEqual([{ level: 6 }]);
});
test('TC-723 — phím số/mũi tên, vùng chạm và bố cục theo vùng chứa', async ({ page }) => {
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
  await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái' }).click();
  const one = page.getByRole('radio', { name: '1', exact: true });
  await one.focus();
  await one.press('0');
  await expect(page.getByRole('radio', { name: '10', exact: true })).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(one).toBeChecked();
  await one.press('6');
  await expect(page.getByRole('radio', { name: '6', exact: true })).toBeChecked();
  for (const width of [360, 480, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await page.getByRole('radio').evaluateAll((inputs) =>
      inputs.map((input) => {
        const r = input.getBoundingClientRect();
        return { width: r.width, height: r.height, y: r.y };
      }),
    );
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect(new Set(boxes.map((b) => b.y)).size).toBe(width < 768 ? 2 : 1);
    expect(await page.getByRole('dialog').evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  }
});
test('TC-723 — lỗi đã khỏi giữ bản nháp, chỉ mở lại và ghi khi bấm nút', async ({ page }) => {
  const calls: string[] = [];
  await page.route('**/entries', async (route) => {
    calls.push('record');
    await route.fulfill(
      calls.length === 1
        ? {
            status: 409,
            json: {
              error: { code: 'ERR_INVALID_STATE_TRANSITION', message: 'Đã khỏi' },
            },
          }
        : { status: 201, json: entry },
    );
  });
  await page.route('**/reopen', async (route) => {
    calls.push('reopen');
    await route.fulfill({ json: issue });
  });
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
  await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái' }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByLabel('Ghi chú (tùy chọn)').fill('Sau đi bộ');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Vấn đề này vừa được đánh dấu đã khỏi.');
  expect(calls).toEqual(['record']);
  await expect(page.getByLabel('Ghi chú (tùy chọn)')).toHaveValue('Sau đi bộ');
  await page.getByRole('button', { name: 'Mở lại và ghi' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls).toEqual(['record', 'reopen', 'record']);
});
test('TC-723 — self, giữ lỗi mạng và chặn tương lai', async ({ page }) => {
  await page.getByRole('button', { name: 'Dùng self' }).click();
  await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái' }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByRole('button', { name: 'Đổi thời điểm' }).click();
  await page.getByLabel('Thời điểm (giờ Việt Nam)').fill('2099-01-01T00:00');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Dùng thời điểm bây giờ' }).click();
  let target = '';
  await page.route('**/entries', (route) => {
    target = route.request().url();
    return route.abort();
  });
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Không thể ghi mức đau. Vui lòng thử lại.');
  expect(target).toContain(`/api/me/profile/pain-issues/${issue.id}/entries`);
  await expect(page.getByRole('radio', { name: '6', exact: true })).toBeChecked();
});

test('TC-728 — nối bản nháp 409 từ tạo vấn đề tới sheet, không tự ghi', async ({ page }) => {
  let records = 0;
  await page.route('**/entries', async (route) => {
    records++;
    await route.fulfill({ status: 201, json: entry });
  });
  await page.route('**/pain-issues', (route) =>
    route.fulfill({
      status: 409,
      json: {
        error: {
          code: 'ERR_PAIN_ISSUE_EXISTS',
          message: 'Trùng vùng',
          details: { existingIssueId: issue.id },
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm vấn đề đau', exact: true }).click();
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await page.getByRole('radio', { name: 'Đầu gối · phải', exact: true }).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByLabel('Ghi chú (tùy chọn)').fill('Bản nháp giữ nguyên');
  await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
  await expect(page.getByRole('heading', { name: 'Ghi mức · Đầu gối · trái' })).toBeVisible();
  await expect(page.getByRole('radio', { name: '6', exact: true })).toBeChecked();
  await expect(page.getByLabel('Ghi chú (tùy chọn)')).toHaveValue('Bản nháp giữ nguyên');
  expect(records).toBe(0);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(records).toBe(1);
});

test('TC-723 — hủy khi mất đồng thuận, bỏ phản hồi muộn và khóa đóng khi đang lưu', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route('**/entries', async (route) => {
    received = true;
    await gate;
    await route.fulfill({ status: 201, json: entry }).catch(() => undefined);
  });
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
  await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái' }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect.poll(() => received).toBe(true);
  await expect(page.getByRole('button', { name: 'Đóng', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Rút đồng thuận' }).evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  release();
  await expect(page.getByText('Hồ sơ chưa được đồng ý lưu dữ liệu.')).toBeVisible();
  await expect(page.getByText('Đã ghi 6/10 cho Đầu gối · trái.')).toHaveCount(0);
});

test('TC-723 — đổi tài khoản xóa bản nháp cũ; đóng sheet trả focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
  const open = page.getByRole('button', { name: 'Ghi mức Đầu gối · trái' });
  await open.focus();
  await open.press('Enter');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(open).toBeFocused();
  await open.click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page
    .getByRole('button', { name: 'Đổi tài khoản' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đổi tài khoản' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await open.click();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
});

test('TC-723 — hướng dẫn không che ghi chú hoặc nút Lưu ở màn thấp', async ({ page }) => {
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 650 });
    await page.getByRole('button', { name: 'Đau nhức', exact: true }).click();
    await page.getByRole('button', { name: 'Ghi mức Đầu gối · trái', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Hướng dẫn chọn mức đau' })).toBeVisible();
    await dialog.getByRole('radio', { name: '6', exact: true }).check();
    const note = dialog.getByLabel('Ghi chú (tùy chọn)');
    await note.fill('Ghi thử');
    await note.scrollIntoViewIfNeeded();
    const usable = await note.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const footer = el.closest('dialog')!.querySelector('footer')!.getBoundingClientRect();
      return r.bottom <= footer.top + 1;
    });
    expect(usable).toBe(true);
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
});
