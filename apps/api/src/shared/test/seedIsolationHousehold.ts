import { expect } from 'vitest';
import type { HealthProfile, ProfileLinkCreated } from '@angia/contracts';
import type { ProfileTestApp } from './startProfileTestApp.js';
import { linkToken } from './profileConsentFixture.js';
import { confirmConsentByAttestation } from './confirmConsentByAttestation.js';
import { seedPendingDocument } from './seedPendingDocument.js';
import { seedReminder } from './seedReminder.js';
import { seedRevisitReminder } from './seedRevisitReminder.js';
import { seedAsNeededDose } from './seedAsNeededDose.js';
import { seedTemperatureReading } from './seedTemperatureReading.js';
import {
  manualCourse as course,
  manualPrescription as prescription,
  manualReading as reading,
} from './healthDataFixtures.js';
const profiles = '/api/health-profiles';
const adherence = { medicationName: 'Canxi', status: 'taking', fromDate: '2026-10-01' };

export async function seedIsolationHousehold(t: ProfileTestApp) {
  const familyId = await t.family();
  const main = await t.session(familyId);
  const created = await t.call(main, 'POST', profiles, { birthYear: 1950, displayName: 'Mẹ' });
  expect(created.status).toBe(201);
  const profile = (await created.json()) as HealthProfile;
  await confirmConsentByAttestation(t, main, profile.id);
  const linked = await t.call(main, 'POST', `${profiles}/${profile.id}/link-invitations`, {});
  expect(linked.status).toBe(201);
  const token = linkToken((await linked.json()) as ProfileLinkCreated);
  const owner = { familyId, profileId: profile.id, accountId: main.accountId };
  const { documentId } = await seedPendingDocument(t, owner, reading);
  const started = await t.call(main, 'POST', `${profiles}/${profile.id}/medication-courses`, course);
  expect(started.status).toBe(201);
  const { id: courseId } = (await started.json()) as { id: string };
  await t.call(main, 'POST', `${profiles}/${profile.id}/adherence-periods`, adherence);
  const body = { type: 'prescription', data: prescription };
  const saved = await t.call(main, 'POST', `${profiles}/${profile.id}/manual-records`, body);
  expect(saved.status).toBe(200);
  const { id: prescriptionId } = ((await saved.json()) as { prescription: { id: string } }).prescription;
  const reminderId = await seedReminder(t.owner, familyId, profile.id, main.accountId);
  const revisitReminderId = await seedRevisitReminder(t.owner, familyId, profile.id);
  const asNeeded = await seedAsNeededDose(t, main, profile.id);
  const readingId = await seedTemperatureReading(t, main, profile.id);
  const ids = { documentId, courseId, prescriptionId, reminderId, revisitReminderId, readingId };
  return { ...ids, asNeeded, familyId, main, profile, token };
}
