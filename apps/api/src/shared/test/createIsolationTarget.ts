import type { ProfileTestApp } from './startProfileTestApp.js';
import type { Target } from './CrossFamilyTarget.js';
import type { seedIsolationHousehold } from './seedIsolationHousehold.js';
import { seedPainJournal } from './seedPainJournal.js';

export async function createIsolationTarget(
  t: ProfileTestApp,
  victim: Awaited<ReturnType<typeof seedIsolationHousehold>>,
  familyId = victim.familyId,
): Promise<Target> {
  const pain = await seedPainJournal(t, victim.main, victim.profile.id);
  return {
    ...pain,
    profileId: victim.profile.id,
    documentId: victim.documentId,
    accountId: victim.main.accountId,
    courseId: victim.courseId,
    asNeededCourseId: victim.asNeeded.courseId,
    doseId: victim.asNeeded.doseId,
    readingId: victim.readingId,
    prescriptionId: victim.prescriptionId,
    reminderId: victim.reminderId,
    revisitReminderId: victim.revisitReminderId,
    token: t.codec.issue({ ...t.codec.verify(victim.token)!, familyId }),
  };
}
