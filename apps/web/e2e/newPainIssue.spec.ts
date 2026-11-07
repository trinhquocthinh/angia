import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
const issueId = '00000000-0000-4000-8000-000000000001';
const apiPath = '**/api/**/pain-issues*';
test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/newPainIssue.html');
  await page.getByRole('button', { name: 'Mở sheet' }).focus();
  await page.getByRole('button', { name: 'Mở sheet' }).press('Enter');
});
test('TC-722 — vùng đang theo dõi trên hình và danh sách bàn giao ngay, không gọi POST', async ({ page }) => {
  let posts = 0;
  await page.route(apiPath, (route) => {
    posts++;
    return route.abort();
  });
  for (const mode of ['Hình', 'Danh sách']) {
    if (mode === 'Danh sách') {
      await page.getByRole('button', { name: 'Mở sheet' }).click();
      await page.getByRole('button', { name: mode, exact: true }).click();
    }
    await page
      .getByRole(mode === 'Hình' ? 'button' : 'radio', {
        name: mode === 'Hình' ? 'Đầu gối · trái · đang theo dõi' : 'Đầu gối · trái',
        exact: true,
      })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('handoff')).toHaveText(JSON.stringify({ kind: 'existing', issueId }));
  }
  expect(posts).toBe(0);
});
test('TC-728 — 409 bàn giao mức 6 và ghi chú, chỉ gửi một POST tạo, chưa tự ghi thêm', async ({ page }) => {
  const requests: { path: string; body: unknown; csrf: string | undefined }[] = [];
  await page.route(apiPath, async (route) => {
    const request = route.request();
    requests.push({
      path: new URL(request.url()).pathname,
      body: request.postDataJSON(),
      csrf: request.headers()['x-csrf-token'],
    });
    await route.fulfill({
      status: 409,
      json: {
        error: {
          code: 'ERR_PAIN_ISSUE_EXISTS',
          message: 'Trùng vùng',
          details: { existingIssueId: issueId },
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'Đầu gối · phải', exact: true }).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu vấn đề đau' })).toBeDisabled();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByLabel('Ghi chú (tùy chọn)').fill('Sau đi bộ');
  await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
  await expect(page.getByTestId('handoff')).toContainText('"level":6');
  await expect(page.getByTestId('handoff')).toContainText('Sau đi bộ');
  await expect(page.getByTestId('handoff')).toContainText('Vùng này đang có vấn đề đang theo dõi.');
  expect(requests).toEqual([
    {
      path: '/api/health-profiles/p/pain-issues',
      csrf: 'csrf',
      body: { region: 'knee', side: 'right', title: '', firstEntry: { level: 6, note: 'Sau đi bộ' } },
    },
  ]);
});
test('giữ bản nháp khi đổi vùng, lỗi mạng và 409 thiếu ID; đóng trả focus', async ({ page }) => {
  await page.route(apiPath, (route) =>
    route.fulfill({
      status: 409,
      json: { error: { code: 'ERR_PAIN_ISSUE_EXISTS', message: 'Vùng đã có vấn đề' } },
    }),
  );
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await page.getByRole('radio', { name: 'Đầu gối · phải', exact: true }).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByLabel('Tên ngắn (tùy chọn)').fill('Sau đi bộ');
  await page.getByRole('button', { name: 'Đổi vùng' }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByLabel('Tên ngắn (tùy chọn)')).toHaveValue('Sau đi bộ');
  await expect(page.getByRole('radio', { name: '6', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
  await expect(page.getByRole('alert')).toHaveText('Vùng đã có vấn đề');
  await expect(page.getByRole('radio', { name: '6', exact: true })).toBeChecked();
  await page.unroute(apiPath);
  await page.route(apiPath, (route) => route.abort());
  await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
  await expect(page.getByRole('alert')).toHaveText('Không thể lưu vấn đề đau. Vui lòng thử lại.');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở sheet' })).toBeFocused();
});

test('tạo lần ghi đầu qua main/self, không tràn ngang ở mobile và hai cột desktop', async ({ page }) => {
  const requests: string[] = [];
  await page.route(apiPath, async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: 201,
      json: {
        ...issue,
        region: 'knee',
        side: 'right',
        entryCount: 1,
        entries: [
          {
            id: issueId,
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
      },
    });
  });
  for (const scope of ['main', 'self']) {
    if (scope === 'self') {
      await page.getByRole('button', { name: 'Dùng self' }).click();
      await page.getByRole('button', { name: 'Mở sheet' }).click();
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
    await page.getByRole('radio', { name: 'Đầu gối · phải', exact: true }).check();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await page.getByRole('radio', { name: '6', exact: true }).check();
    const geometry = await page.getByRole('dialog').evaluate((dialog) => ({
      width: dialog.getBoundingClientRect().width,
      scroll: dialog.scrollWidth,
      client: dialog.clientWidth,
      height: dialog.getBoundingClientRect().height,
      viewport: innerHeight,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    if (scope === 'main') expect(geometry.height).toBe(geometry.viewport);
    else expect(geometry.width).toBeLessThanOrEqual(880);
    await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('handoff')).toHaveText(JSON.stringify({ kind: 'created', issueId }));
  }
  expect(requests).toEqual(['/api/health-profiles/p/pain-issues', '/api/me/profile/pain-issues']);
});
test('mất đồng thuận trong lúc lưu: bỏ phản hồi muộn và không bàn giao dữ liệu', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route(apiPath, async (route) => {
    received = true;
    await gate;
    await route
      .fulfill({
        status: 409,
        json: {
          error: {
            code: 'ERR_PAIN_ISSUE_EXISTS',
            message: 'Trùng vùng',
            details: { existingIssueId: issueId },
          },
        },
      })
      .catch(() => undefined);
  });
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await page.getByRole('radio', { name: 'Đầu gối · phải', exact: true }).check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('radio', { name: '6', exact: true }).check();
  await page.getByRole('button', { name: 'Lưu vấn đề đau' }).click();
  await expect.poll(() => received).toBe(true);
  await expect(page.getByRole('button', { name: 'Đóng', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Rút đồng thuận' })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  release();
  await expect(page.getByTestId('handoff')).toHaveText('null');
});
test('workspace chỉ mở sheet khi danh sách đã tải và nơi nhận bàn giao có sẵn', async ({ page }) => {
  await page.route(apiPath, (route) => route.fulfill({ json: { issues: [issue] } }));
  await page.goto('/e2e/newPainIssue.html?workspace');
  await page.getByRole('button', { name: 'Thêm vấn đề đau', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Đầu gối · trái · đang theo dõi', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
