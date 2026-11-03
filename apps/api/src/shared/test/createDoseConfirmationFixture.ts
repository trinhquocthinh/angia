import type { HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from './confirmConsentByAttestation.js';
import { vietnamDate } from './createFiniteCourse.js';
import { linkAccountToProfile } from './profileConsentFixture.js';
import type { SeededSession } from './seedAuthFixtures.js';
import { seedReminder } from './seedReminder.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

export const createNamedProfile = async (t: ProfileTestApp, main: SeededSession, displayName: string) =>
  (await (
    await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName })
  ).json()) as HealthProfile;

// Hồ sơ Bà liên kết member; hồ sơ Bé không liên kết, người nhận là Cha; Mẹ là `main` không được chỉ định.
export async function createDoseConfirmationFixture(t: ProfileTestApp) {
  const familyId = await t.family();
  const father = await t.session(familyId, 'main', 'Cha');
  const mainMother = await t.session(familyId, 'main', 'Mẹ quản lý');
  const linked = await t.session(familyId, 'member', 'Bà M');
  const otherMember = await t.session(familyId, 'member', 'Chú');
  const motherProfile = await createNamedProfile(t, father, 'Bà');
  await linkAccountToProfile(t, father, linked, motherProfile.id);
  const childProfile = await createNamedProfile(t, father, 'Bé');
  await confirmConsentByAttestation(t, father, childProfile.id);
  const reminderOn = (profileId: string, date = vietnamDate(0), recipient?: string) =>
    seedReminder(t.owner, familyId, profileId, recipient, date);
  return {
    familyId,
    father,
    mainMother,
    linked,
    otherMember,
    motherProfile,
    childProfile,
    motherReminder: await reminderOn(motherProfile.id),
    childReminder: await reminderOn(childProfile.id, vietnamDate(0), father.accountId),
    reminderOn,
  };
}
