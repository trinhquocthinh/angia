import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { DocumentReview } from '@angia/contracts';

export async function confirmReading(
  page: Page,
  review: DocumentReview,
  expected: { systolic: number; diastolic: number; pulse: number | null },
): Promise<void> {
  const extracted = review.extraction;
  expect(extracted?.type, 'Phải có dữ liệu OCR thật để đối soát').toBe('device_reading');
  if (extracted?.type !== 'device_reading') throw new Error('Thiếu dữ liệu máy đo từ Worker');
  // Form nhận đúng dữ liệu Worker; người duyệt đối soát và sửa theo ảnh (SPEC-010).
  for (const [label, key] of [
    ['Tâm thu', 'systolic'],
    ['Tâm trương', 'diastolic'],
    ['Mạch (không bắt buộc)', 'pulse'],
  ] as const) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toHaveValue(extracted[key] === null ? '' : String(extracted[key]));
    if (extracted[key] !== expected[key]) {
      test.info().annotations.push({
        type: 'ocr-correction',
        description: `${key}: ${extracted[key]} → ${expected[key]}`,
      });
    }
    await field.fill(expected[key] === null ? '' : String(expected[key]));
  }
}
