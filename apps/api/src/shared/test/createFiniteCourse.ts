import type { MedicationCourse } from '@angia/contracts';
import { expect } from 'vitest';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';
// Ngày Việt Nam lệch `offset` ngày so với hôm nay: đợt hữu hạn phải còn hiệu lực theo đồng hồ thật (BR-029).
export function vietnamDate(offset = 0): string {
  const date = new Date(`${medicationToday(() => new Date())}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

// Đợt từ đơn 7 ngày bắt đầu 3 ngày trước: kết thúc sau hôm nay 3 ngày.
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
      issuedDate: vietnamDate(-3),
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
