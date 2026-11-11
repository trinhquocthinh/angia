import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
import { selfPainFixture } from './selfPainFixture.js';

for (const role of ['main', 'member'] as const) {
  test(`US-042: ${role} mở → ghi → khỏi → mở lại bằng cửa tự quản`, async ({ page }) => {
    const fixture = await selfPainFixture(page, role);
    await page.goto('/my-profile');
    const pain = page
      .getByRole('navigation', { name: 'Các mục hồ sơ của tôi' })
      .getByRole('link', { name: 'Đau nhức' });
    await expect(pain).toBeVisible();
    expect(fixture.requests.some((r) => r.path.includes('/pain-issues'))).toBe(false);
    expect(fixture.loaded.some((p) => /SelfPainJournal|painIssueDetail/.test(p))).toBe(false);
    // TC-723: bốn chạm từ hồ sơ đã mở, không tính thời gian mạng giả là NFR-8.
    await pain.click();
    await expect(page).toHaveURL(/my-profile\?section=pain$/);
    await expect(page.getByRole('region', { name: 'Đau nhức', exact: true })).toBeVisible();
    expect(fixture.loaded.some((p) => /SelfPainJournal/.test(p))).toBe(true);
    await page.getByRole('button', { name: /Ghi mức Đầu gối/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('radio', { checked: true })).toHaveCount(0);
    await dialog.getByRole('radio', { name: '4', exact: true }).check();
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('article', { name: 'Đầu gối · trái' })).toContainText('4/10');
    await page.getByRole('button', { name: /Xem vấn đề Đầu gối/ }).click();
    await expect(page).toHaveURL(`/my-profile/pain/${issue.id}`);
    await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
    await page.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
    await dialog.getByRole('button', { name: 'Đánh dấu đã khỏi', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tùy chọn vấn đề' }).click();
    await page.getByRole('button', { name: 'Mở lại', exact: true }).click();
    await dialog.getByRole('button', { name: 'Mở lại', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Ghi nhanh', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '‹ Đau nhức', exact: true }).click();
    await expect(page).toHaveURL(/my-profile\?section=pain$/);
    const writes = fixture.requests.filter((r) => r.method !== 'GET' && r.path.includes('/pain-issues'));
    expect(writes.map((r) => r.path)).toEqual([
      `/api/me/profile/pain-issues/${issue.id}/entries`,
      `/api/me/profile/pain-issues/${issue.id}/resolve`,
      `/api/me/profile/pain-issues/${issue.id}/reopen`,
    ]);
    for (const write of writes) {
      expect(write.csrf).toBe('csrf-test');
      expect(write.body).not.toHaveProperty('profileId');
    }
    expect(
      fixture.requests.some(
        (r) => r.path.startsWith('/api/health-profiles/') && r.path.includes('/pain-issues'),
      ),
    ).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('US-042: đường dẫn trực tiếp không có liên kết hoặc đồng thuận không gọi sổ đau nhức', async ({
  page,
}) => {
  const fixture = await selfPainFixture(page);
  fixture.session.account.healthProfileId = null;
  await page.goto(`/my-profile/pain/${issue.id}`);
  await expect(page.getByText('Tài khoản chưa liên kết hồ sơ sức khỏe.')).toBeVisible();
  fixture.session.account.healthProfileId = fixture.summary.id;
  fixture.summary.consentStatus = 'withdrawn';
  await page.reload();
  await expect(page.getByText('Hồ sơ chưa được đồng ý lưu dữ liệu.')).toBeVisible();
  expect(fixture.requests.some((r) => r.path.includes('/pain-issues'))).toBe(false);
});

test('US-042: mất đồng thuận trong khi ghi thì đóng sheet và không giữ nội dung sức khỏe', async ({
  page,
}) => {
  const fixture = await selfPainFixture(page);
  await page.goto('/my-profile?section=pain');
  await page.getByRole('button', { name: /Ghi mức Đầu gối/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: '4', exact: true }).check();
  fixture.summary.consentStatus = 'withdrawn';
  await page.route('**/entries', (route) =>
    route.fulfill({
      status: 409,
      json: { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Cần đồng thuận.' } },
    }),
  );
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Hồ sơ chưa được đồng ý lưu dữ liệu.')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('US-042: đổi liên kết khi ghi không hiện sổ của hồ sơ cũ', async ({ page }) => {
  const fixture = await selfPainFixture(page);
  await page.goto('/my-profile?section=pain');
  await page.getByRole('button', { name: /Ghi mức Đầu gối/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: '4', exact: true }).check();
  fixture.session.account.healthProfileId = '00000000-0000-4000-8000-000000000009';
  await page.route('**/entries', (route) =>
    route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy.' } } }),
  );
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('US-042: mục xét nghiệm vẫn chỉ đọc, tab đau nhức không phụ thuộc số đo', async ({ page }) => {
  await selfPainFixture(page);
  await page.goto('/my-profile?section=lab-results');
  await expect(
    page.getByRole('navigation', { name: 'Các mục hồ sơ của tôi' }).getByRole('link', { name: 'Đau nhức' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Diễn biến sức khỏe', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Thêm|Sửa|Xóa|Nhập tay/ })).toHaveCount(0);
});

test('US-042: giữ bản nháp khi kiểm lại cùng hồ sơ lúc quay lại ứng dụng', async ({ page }) => {
  const fixture = await selfPainFixture(page);
  await page.goto('/my-profile?section=pain');
  await page.getByRole('button', { name: /Ghi mức Đầu gối/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: '4', exact: true }).check();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/me/profile', async (route) => {
    await gate;
    await route.fulfill({ json: fixture.summary });
  });
  const refreshed = page.waitForRequest((r) => new URL(r.url()).pathname === '/api/me/profile');
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
  await refreshed;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  try {
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radio', { name: '4', exact: true })).toBeChecked();
  } finally {
    release();
  }
  await expect(dialog.getByRole('radio', { name: '4', exact: true })).toBeChecked();
});

test('US-042: tự mở vấn đề mới từ danh sách rỗng', async ({ page }) => {
  const fixture = await selfPainFixture(page);
  fixture.state.empty = true;
  await page.goto('/my-profile?section=pain');
  await page.getByRole('button', { name: 'Thêm vấn đề đau', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await dialog.getByRole('radio', { name: 'Đầu gối · trái', exact: true }).check();
  await dialog.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await dialog.getByRole('radio', { name: '5', exact: true }).check();
  await dialog.getByRole('button', { name: 'Lưu vấn đề đau', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Ghi mức Đầu gối/ })).toBeVisible();
  const create = fixture.requests.find((r) => r.method === 'POST');
  expect(create?.path).toBe('/api/me/profile/pain-issues');
  expect(create?.body).toEqual({ region: 'knee', side: 'left', title: '', firstEntry: { level: 5 } });
});

test('TC-861: chỉ tải giao diện xét nghiệm khi mở mục xét nghiệm', async ({ page }) => {
  const fixture = await selfPainFixture(page);
  await page.goto('/my-profile');
  await expect(page.getByRole('heading', { name: 'Hồ sơ của tôi', exact: true })).toBeVisible();
  expect(fixture.loaded.some((path) => /LabSeriesList/.test(path))).toBe(false);
  await page
    .getByRole('navigation', { name: 'Các mục hồ sơ của tôi' })
    .getByRole('link', { name: 'Kết quả xét nghiệm', exact: true })
    .click();
  await expect(page.getByText('Chưa có kết quả xét nghiệm nào.', { exact: true })).toBeVisible();
  expect(fixture.loaded.some((path) => /LabSeriesList/.test(path))).toBe(true);
  await expect(page.getByRole('button', { name: /Thêm|Sửa|Xóa|Nhập tay/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Tải ảnh phiếu xét nghiệm' })).toHaveCount(0);
});
