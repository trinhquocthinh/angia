import { confirmReading } from './support/confirmReading.js';
import type { DocumentReview, MeasurementSeries } from '@angia/contracts';
import { test, expect } from './support/sitFixture.js';
import { bloodPressure, vietnamDay } from './support/summarySeed.js';
import { uploadReading } from './support/uploadReading.js';

test('TC-092: tải ảnh máy đo → Worker thật → duyệt → số đo đúng trên biểu đồ', async ({
  page,
  sit,
  profile,
}) => {
  for (let day = 1; day <= 3; day++) await sit.record(profile.id, bloodPressure(day));
  const { documentId, expected } = await uploadReading(page, profile.displayName);
  await expect
    .poll(
      async () => {
        const review = await sit.get<{ document: { status: string } }>(
          `/api/source-documents/${documentId}/review`,
        );
        const status = review.document.status;
        if (['manual_entry', 'awaiting_budget'].includes(status)) {
          throw new Error(`Worker chuyển ${status}; TC-092 yêu cầu OCR thật thành công`);
        }
        return status;
      },
      { timeout: 120_000, intervals: [1000, 2000, 4000] },
    )
    .toBe('pending_review');
  await expect(page).toHaveURL(new RegExp(`/review/${documentId}$`));
  const review = await sit.get<DocumentReview>(`/api/source-documents/${documentId}/review`);
  await confirmReading(page, review, expected);
  await page.getByLabel('Ngày đo *', { exact: true }).fill(vietnamDay());
  await page.getByLabel('Giờ đo', { exact: true }).fill('09:45');
  const saved = page.waitForResponse(
    (r) => r.url().endsWith(`/${documentId}/approve`) && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Lưu vào sổ', exact: true }).click();
  expect((await saved).status()).toBe(200);
  const seriesLoaded = page.waitForResponse((r) =>
    r.url().includes(`/health-profiles/${profile.id}/measurements/series`),
  );
  await page.goto(`/profiles/${profile.id}`);
  const response = await seriesLoaded;
  expect(response.status()).toBe(200);
  const series = (await response.json()) as MeasurementSeries;
  expect(series.points).toHaveLength(4);
  expect(series.points).toContainEqual(
    expect.objectContaining({
      sourceDocumentId: documentId,
      measuredOn: vietnamDay(),
      measuredTime: '09:45',
      ...expected,
    }),
  );
  const chart = page.getByRole('region', { name: /Diễn biến huyết áp/ });
  await expect(chart.locator('svg')).toBeVisible();
  await expect(chart.locator('svg path').first()).toBeAttached();
  const row = chart.locator('tbody tr').filter({ hasText: '09:45' });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(`${expected.systolic}/${expected.diastolic} mmHg`);
});
