import type { Page } from '@playwright/test';
import type { components } from '../src/shared/api/schema.gen.js';
import { householdStartFixture } from './householdStartFixture.js';
import { reminderUiSeed } from './reminderUiSeed.js';
import { reviewFixtureRoute } from './reviewFixtureRoute.js';

export const REVIEW_ID = '0199bc85-8918-7000-8000-000000000040';
type Document = components['schemas']['SourceDocument'];

// Dữ liệu tổng hợp; không đọc hoặc ghi lên cơ sở dữ liệu người dùng.
export async function reviewFixture(page: Page) {
  const household = await householdStartFixture(page);
  household.family = true;
  const { profile } = reminderUiSeed();
  const document: Document = {
    id: REVIEW_ID,
    healthProfileId: profile.id,
    batchId: REVIEW_ID,
    type: 'prescription',
    status: 'pending_review',
    documentDate: '2026-11-26',
    mimeType: 'image/jpeg',
    sizeBytes: 1048576,
    hasImage: true,
    createdAt: '2026-11-26T03:00:00Z',
  };
  const extraction: NonNullable<components['schemas']['DocumentReview']['extraction']> = {
    type: 'prescription',
    issuedDate: '2026-11-26',
    revisitDate: null,
    facility: 'Cơ sở khám mẫu',
    diagnosis: null,
    items: [
      {
        name: 'Thuốc mẫu',
        strength: '5 mg',
        quantityPerDose: 1,
        doseUnit: 'viên',
        slots: ['morning'],
        durationDays: null,
        longTerm: true,
        note: null,
        totalQuantity: null,
      },
    ],
  };
  const state = {
    household,
    profile,
    document,
    extraction,
    documents: [document] as Document[],
    error: false,
    more: false,
    writes: [] as { body: unknown; csrf: string | undefined }[],
  };
  await page.route('**/api/**', (route) => reviewFixtureRoute(route, state));
  return state;
}
