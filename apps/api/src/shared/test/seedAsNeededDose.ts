import type { CurrentMedications } from '@angia/contracts';
import { expect } from 'vitest';
import { vietnamDate } from './createFiniteCourse.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

export const asNeededItem = {
  name: 'Paracetamol',
  strength: '250mg',
  quantityPerDose: null,
  doseUnit: 'gói',
  slots: ['as_needed'],
  durationDays: 5,
  longTerm: false,
  note: null,
  totalQuantity: null,
};

// Đơn nhập tay một dòng (mặc định "Khi cần") kê hôm qua (theo đồng hồ thật, còn hiệu lực hôm nay — BR-030).
export async function seedAsNeededCourse(
  t: ProfileTestApp,
  main: SeededSession,
  profileId: string,
  item: { name: string; [field: string]: unknown } = asNeededItem,
) {
  const profile = `/api/health-profiles/${profileId}`;
  const data = {
    type: 'prescription',
    issuedDate: vietnamDate(-1),
    facility: null,
    diagnosis: null,
    items: [item],
  };
  const saved = await t.call(main, 'POST', `${profile}/manual-records`, { type: 'prescription', data });
  expect(saved.status).toBe(200);
  const body = (await saved.json()) as { prescription: { id: string } };
  const current = (await (
    await t.call(main, 'GET', `${profile}/medication-courses/current`)
  ).json()) as CurrentMedications;
  const course = current.courses.find((c) => c.name === item.name)!;
  return { prescriptionId: body.prescription.id, courseId: course.id };
}

export async function seedAsNeededDose(
  t: ProfileTestApp,
  main: SeededSession,
  profileId: string,
  item = asNeededItem,
) {
  const { courseId, prescriptionId } = await seedAsNeededCourse(t, main, profileId, item);
  const response = await t.call(main, 'POST', `/api/health-profiles/${profileId}/as-needed-doses`, {
    courseId,
    givenAt: new Date(Date.now() - 60_000).toISOString(),
  });
  expect(response.status).toBe(201);
  return { courseId, prescriptionId, doseId: ((await response.json()) as { id: string }).id };
}
