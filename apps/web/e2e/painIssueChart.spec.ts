import { expect, test } from '@playwright/test';
import { issue } from './painJournalFixture.js';
const entries = ['01', '03', '04', '14', '15'].map((day, i) => ({
  id: `00000000-0000-4000-8000-00000000001${i}`,
  level: i % 2 ? 10 : 1,
  recordedAt: `2026-11-${day}T03:00:00Z`,
  note: `Ghi chú ${day}`,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
}));
const detail = { ...issue, entryCount: 5, entries, exercises: [], statusEvents: [] };
test.use({ timezoneId: 'America/Los_Angeles' });
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-20T03:00:00Z') });
  await page.route('**/api/**/pain-issues/**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith('/context')) return route.fulfill({ json: detail });
    await route.fulfill({
      json: {
        from: url.searchParams.get('from'),
        to: url.searchParams.get('to'),
        asNeededDoses: [
          { courseId: issue.id, name: 'Thuốc A', givenAt: '2026-11-04T03:00:00Z', quantity: 1, unit: 'viên' },
        ],
        courses: [
          { courseId: issue.id, name: 'Thuốc A', startDate: '2026-10-01', endDate: null, status: 'active' },
        ],
      },
    });
  });
});
test('TC-724 — SVG có đủ điểm và hai đoạn nét, tooltip khi chạm, không tràn mobile', async ({
  page,
}, testInfo) => {
  await page.goto('/e2e/painIssueDetail.html');
  const chart = page.getByRole('region', { name: 'Mức đau trong 12 tuần' });
  const svg = chart.locator('[aria-hidden="true"] svg');
  await expect(svg).toHaveCount(1);
  const line = svg.locator('path[stroke="#1f2a2a"]').first();
  await expect(line).toHaveAttribute('d', /M.*M/);
  const points = svg.locator('path[fill="#1f2a2a"]');
  await expect(points).toHaveCount(5);
  await expect(svg).toContainText('Thuốc A');
  await chart.screenshot({ path: testInfo.outputPath('pain-chart.png') });
  await points.first().tap();
  await expect(svg).toContainText('01/11 · 10:00 — 1/10');
  await svg.locator('path[fill="#55615f"]').tap();
  await expect(svg).toContainText('Thuốc A');
  await expect(svg).toContainText('04/11/2026 · 10:00');
  await expect(chart).toContainText('Khi cần · Thuốc A');
  await expect(chart).toContainText('Đợt thuốc · Thuốc A');
  await expect(chart.locator('table')).toContainText('5 lần ghi.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('đổi 4/12/26 tuần gửi đúng khoảng và self dùng endpoint phiên', async ({ page }) => {
  await page.goto('/e2e/painIssueDetail.html');
  const chart = page.getByRole('region', { name: /Mức đau trong/ });
  for (const [weeks, from] of [
    [4, '2026-10-26'],
    [26, '2026-05-25'],
  ] as const) {
    const sent = page.waitForRequest(
      (r) => r.url().includes('/context?') && new URL(r.url()).searchParams.get('from') === from,
    );
    await chart.getByRole('button', { name: `${weeks} tuần`, exact: true }).click();
    expect(new URL((await sent).url()).searchParams.get('to')).toBe('2026-11-20');
  }
  const sent = page.waitForRequest(
    (r) => r.url().includes('/api/me/profile/pain-issues/') && r.url().includes('/context?'),
  );
  await page.getByRole('button', { name: 'Dùng self' }).click();
  await sent;
  await expect(chart.getByRole('button', { name: '12 tuần', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('ít điểm dùng thẻ, không tải ECharts, giữ bối cảnh và bảng ẩn', async ({ page }) => {
  await page.route(`**/pain-issues/${issue.id}`, (route) =>
    route.fulfill({ json: { ...detail, entries: entries.slice(0, 2), entryCount: 2 } }),
  );
  const chunks: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('PainChartCanvas')) chunks.push(request.url());
  });
  await page.goto('/e2e/painIssueDetail.html');
  const chart = page.getByRole('region', { name: 'Mức đau trong 12 tuần' });
  await expect(chart).toContainText('Cần ít nhất 4 lần ghi trong 12 tuần');
  await expect(chart).toContainText('Khi cần · Thuốc A');
  await expect(chart.locator('svg')).toHaveCount(0);
  expect(chunks).toEqual([]);
  await expect(chart.locator('ul').first().getByRole('listitem').first()).toContainText('03/11/2026 · 10:00');
  await expect(chart.locator('.sr-only > table')).toHaveCount(1);
});
test('lỗi bối cảnh giữ lần ghi, cho thử lại; rút đồng thuận che toàn bộ dữ liệu', async ({ page }) => {
  await page.route('**/context?*', (route) => route.fulfill({ status: 500, json: {} }));
  await page.goto('/e2e/painIssueDetail.html');
  const chart = page.getByRole('region', { name: 'Mức đau trong 12 tuần' });
  await expect(chart.getByRole('alert')).toContainText('Không thể tải bối cảnh thuốc.');
  await expect(chart.locator('table')).toContainText('5 lần ghi.');
  await page.unroute('**/context?*');
  await chart.getByRole('button', { name: 'Thử lại bối cảnh thuốc' }).click();
  await expect(chart).toContainText('Thuốc A');
  await page.getByRole('button', { name: 'Rút đồng thuận' }).click();
  await expect(chart).toHaveCount(0);
  await expect(page.getByText('Thuốc A')).toHaveCount(0);
});

test('ghi nhanh làm mới biểu đồ và bối cảnh, từ 3 thẻ sang 4 điểm', async ({ page }) => {
  const current = { ...detail, entries: entries.slice(0, 3), entryCount: 3 };
  await page.route(`**/pain-issues/${issue.id}`, (route) => route.fulfill({ json: current }));
  await page.route('**/entries', async (route) => {
    const body = route.request().postDataJSON();
    const entry = { ...entries[3]!, ...body, recordedAt: '2026-11-20T03:00:00Z' };
    current.entries.push(entry);
    current.entryCount++;
    await route.fulfill({ status: 201, json: entry });
  });
  await page.goto('/e2e/painIssueDetail.html');
  const chart = page.getByRole('region', { name: 'Mức đau trong 12 tuần' });
  await expect(chart).toContainText('Cần ít nhất 4 lần ghi');
  await expect(chart).toContainText('Thuốc A');
  const refreshed = page.waitForRequest((request) => request.url().includes('/context?'));
  const quick = page.getByRole('region', { name: 'Ghi nhanh', exact: true });
  await quick.getByRole('radio', { name: '4', exact: true }).check();
  await quick.getByRole('button', { name: 'Lưu', exact: true }).click();
  await refreshed;
  await expect(chart.locator('[aria-hidden="true"] svg path[fill="#1f2a2a"]')).toHaveCount(4);
  await expect(chart.locator('table')).toContainText('4 lần ghi.');
  await expect(chart).not.toContainText('Cần ít nhất 4 lần ghi');
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test('TC-724 — tooltip mức đau không chặn chạm liều thuốc ở desktop', async ({ page }) => {
    await page.goto('/e2e/painIssueDetail.html');
    const chart = page.getByRole('region', { name: 'Mức đau trong 12 tuần' });
    const svg = chart.locator('[aria-hidden="true"] svg');
    await expect(svg).toHaveAttribute('height', '368');
    await svg.locator('path[fill="#1f2a2a"]').first().tap({ timeout: 5000 });
    await expect(svg).toContainText('01/11 · 10:00 — 1/10');
    await svg.locator('path[fill="#55615f"]').tap({ timeout: 5000 });
    await expect(svg).toContainText('04/11/2026 · 10:00');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
