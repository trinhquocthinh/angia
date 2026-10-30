import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const expectedSchema = z.object({
  systolic: z.number().int().positive(),
  diastolic: z.number().int().positive(),
  pulse: z.number().int().positive().nullable(),
});

export async function uploadReading(page: Page, profileName: string) {
  const image = process.env.E2E_READING_JPEG;
  const answer = process.env.E2E_READING_EXPECTED;
  if (!image || !answer) throw new Error('Thiếu E2E_READING_JPEG hoặc E2E_READING_EXPECTED');
  const expected = expectedSchema.parse(JSON.parse(await readFile(answer, 'utf8')));
  await page.goto('/upload');
  await page.getByRole('button', { name: 'Tôi đã hiểu', exact: true }).click();
  await page.getByRole('button', { name: profileName, exact: true }).click();
  await page.getByRole('button', { name: 'Máy đo cá nhân', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(image);
  await page.getByRole('button', { name: 'Che thông tin', exact: true }).click();
  await page.getByRole('button', { name: 'Xem bản sẽ tải lên', exact: true }).click();
  await page.getByRole('radio', { name: 'Gửi tự động nhận diện', exact: true }).check();
  await page
    .getByRole('checkbox', { name: 'Tôi đã kiểm tra, ảnh này không còn thông tin định danh' })
    .check();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page
    .getByRole('button', { name: 'Ảnh không có thông tin cá nhân — vẫn tải lên', exact: true })
    .click();
  const uploaded = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/upload-batches'),
  );
  await page.getByRole('button', { name: /Xong — gửi 1 ảnh/ }).click();
  const response = await uploaded;
  expect(response.status(), 'Upload JPEG thật qua giao diện').toBe(201);
  const batch = (await response.json()) as { documents: { id: string }[]; rejectedFiles: unknown[] };
  expect(batch.rejectedFiles).toHaveLength(0);
  expect(batch.documents).toHaveLength(1);
  return { documentId: batch.documents[0]!.id, expected };
}
