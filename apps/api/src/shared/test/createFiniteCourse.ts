import type { MedicationCourse } from '@angia/contracts';
import { expect } from 'vitest';
import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';
export async function createFiniteCourse(
  t: ProfileTestApp,
  main: SeededSession,
  profileId: string,
  collection: string,
): Promise<MedicationCourse> {
  const response = await t.call(main, 'POST', `/api/health-profiles/${profileId}/manual-records`, {
    type: 'prescription',
    data: {
      type: 'prescription',
      issuedDate: '2026-10-01',
      facility: null,
      diagnosis: null,
      items: [
        {
          name: 'Canxi',
          strength: '500mg',
          quantityPerDose: 1,
          doseUnit: 'viên',
          slots: ['morning'],
          durationDays: 7,
          longTerm: false,
          note: null,
          totalQuantity: null,
        },
      ],
    },
  });
  expect(response.status).toBe(200);
  const list = (await (await t.call(main, 'GET', `${collection}/stoppable`)).json()) as {
    courses: MedicationCourse[];
  };
  return list.courses[0]!;
}
