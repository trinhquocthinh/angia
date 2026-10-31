import type { VisitSummary } from '@angia/contracts';
import { checkSummaryPages } from '../scripts/e2e/checkSummaryPages.js';
import { readSummaryPdf } from '../scripts/e2e/readSummaryPdf.js';
import { test, expect } from './support/sitFixture.js';
import { seedSummary, vietnamDay } from './support/summarySeed.js';

for (const count of [13, 100]) {
  test(`TC-093: bản tóm tắt ${count} ngày đo, đủ thuốc/xét nghiệm và chân trang`, async ({
    page,
    browserName,
    sit,
    profile,
  }, testInfo) => {
    await seedSummary(sit, profile.id, count);
    await page.goto(`/profiles/${profile.id}/summary`);
    const loaded = page.waitForResponse((r) => {
      if (!r.url().includes(`/health-profiles/${profile.id}/visit-summary`)) return false;
      const query = new URL(r.url()).searchParams;
      const from = query.get('from');
      const to = query.get('to');
      return Boolean(from && to && Date.parse(to) - Date.parse(from) > 150 * 86_400_000);
    });
    await page.getByRole('button', { name: '6 tháng', exact: true }).click();
    const response = await loaded;
    expect(response.status()).toBe(200);
    const summary = (await response.json()) as VisitSummary;
    expect(summary.measurements).toHaveLength(count);
    expect(summary.currentMedications).toHaveLength(1);
    expect(summary.latestLabResults).toHaveLength(1);
    await expect(page.getByRole('button', { name: 'In / Lưu PDF', exact: true })).toBeEnabled();
    const sheet = page.locator('.summary-print-root .summary-sheet');
    await expect(sheet).toContainText('Thuốc thử E2E');
    await expect(sheet).toContainText('HbA1c E2E');
    // Kiểm nút gọi lệnh in; PDF bên dưới vẫn render trang thật, không chèn HTML mẫu.
    await page.evaluate('window.__printCalls = 0; window.print = () => { window.__printCalls++; };');
    await page.getByRole('button', { name: 'In / Lưu PDF', exact: true }).click();
    expect(await page.evaluate('window.__printCalls')).toBe(1);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate('document.fonts.ready');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('tfoot')).toHaveCSS('display', 'table-footer-group');
    const createdDay = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(summary.createdAt),
    );
    await expect(sheet.locator('footer')).toContainText(`Tạo ngày ${createdDay}`);
    await expect(sheet.locator('footer')).toContainText(summary.disclaimer);
    const dates = Array.from({ length: count }, (_, i) => vietnamDay(i).split('-').reverse().join('/'));
    for (const date of dates) await expect(sheet).toContainText(date);
    if (browserName === 'chromium') {
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      await testInfo.attach('summary.pdf', { body: pdf, contentType: 'application/pdf' });
      const pages = await readSummaryPdf(pdf);
      await testInfo.attach('pdf-text.json', {
        body: Buffer.from(JSON.stringify(pages)),
        contentType: 'application/json',
      });
      checkSummaryPages(pages, createdDay, count > 24);
      const allText = pages.map((p) => p.text).join(' ');
      for (const date of dates) expect(allText).toContain(date);
      expect(allText).toContain('Thuốc thử E2E');
      expect(allText).toContain('HbA1c E2E');
    }
  });
}
