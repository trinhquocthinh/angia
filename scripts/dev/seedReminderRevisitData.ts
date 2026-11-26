import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { prescriptions, revisitReminders } from '../../apps/api/src/shared/db/schema/index.js';
import { reminderSeedId } from './reminderSeedId.js';

export async function seedReminderRevisitData(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  date: string,
  now: Date,
  withPrescriptions = true,
) {
  if (withPrescriptions) {
    await tx
      .insert(prescriptions)
      .values(
        [1, 2].map((index) => ({
          id: reminderSeedId(profileId, `${date}-prescription-${index}`),
          familyId,
          healthProfileId: profileId,
          issuedDate: date,
          revisitDate: date,
          facility: index === 1 ? 'Cơ sở khám mẫu 1' : null,
          manualWithoutSource: true,
        })),
      )
      .onConflictDoNothing();
  }
  const id = reminderSeedId(profileId, `${date}-revisit`);
  await tx
    .insert(revisitReminders)
    .values({
      id,
      familyId,
      healthProfileId: profileId,
      revisitDate: date,
      offsetKind: 'same_day',
      sendDate: date,
      scheduledAt: new Date(`${date}T06:00:00+07:00`),
      sentAt: now,
    })
    .onConflictDoNothing();
  return id;
}
