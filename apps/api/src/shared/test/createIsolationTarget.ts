import { randomUUID } from 'node:crypto';
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
  const exportId = randomUUID();
  await t.owner.query(
    `INSERT INTO data_exports(id,account_id,status,object_key,expires_at)
     VALUES($1,$2,'ready',$3,now()+interval '24 hours')`,
    [exportId, victim.main.accountId, `exports/${exportId}.zip`],
  );
  return {
    exportId,
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
