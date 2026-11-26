import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import {
  doseSlots,
  medicationCourses,
  reminderRecipients,
} from '../../apps/api/src/shared/db/schema/index.js';
import { createReminderSeedData } from './createReminderSeedData.js';

export async function seedReminderSchedule(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  actorIds: string[],
  date: string,
) {
  const { slots, medications } = createReminderSeedData(profileId);
  await tx
    .insert(doseSlots)
    .values(slots.map((slot) => ({ ...slot, familyId, healthProfileId: profileId })))
    .onConflictDoNothing();
  if (actorIds.length)
    await tx
      .insert(reminderRecipients)
      .values(actorIds.map((accountId) => ({ familyId, healthProfileId: profileId, accountId })))
      .onConflictDoNothing();
  await tx
    .insert(medicationCourses)
    .values(
      medications.map(({ courseId, ...medication }) => ({
        ...medication,
        id: courseId,
        familyId,
        healthProfileId: profileId,
        nameNormalized: medication.name.toLowerCase(),
        source: 'self_reported' as const,
        slots: slots.map(({ slot }) => slot),
        startDate: date,
        endDate: date,
        status: 'active' as const,
      })),
    )
    .onConflictDoNothing();
}
