import { and, eq } from 'drizzle-orm';
import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import { doseConfirmations, reminders } from '../../apps/api/src/shared/db/schema/index.js';
import { reminderSeedId } from './reminderSeedId.js';
import { createReminderSeedData } from './createReminderSeedData.js';
import { seedReminderSchedule } from './seedReminderSchedule.js';

// Đánh sentAt để không gửi Push mẫu; đợt thuốc mẫu chỉ có hiệu lực trong ngày seed.
export async function seedReminderMedicationData(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  actorIds: string[],
  date: string,
  now: Date,
) {
  const { slots, medications } = createReminderSeedData(profileId);
  await seedReminderSchedule(tx, familyId, profileId, actorIds, date);
  const rows = slots.map(({ slot, timeOfDay }) => ({
    id: reminderSeedId(profileId, `${date}-${slot}`),
    familyId,
    healthProfileId: profileId,
    date,
    slot,
    scheduledAt: new Date(`${date}T${timeOfDay}:00+07:00`),
    medications,
    sentAt: now,
  }));
  await tx.insert(reminders).values(rows).onConflictDoNothing();
  if (actorIds.length)
    await tx
      .insert(doseConfirmations)
      .values({
        id: reminderSeedId(profileId, `${date}-confirmation`),
        familyId,
        healthProfileId: profileId,
        date,
        slot: 'morning',
        reminderId: rows[0]!.id,
        confirmedByAccountId: actorIds[0]!,
        confirmedByName: 'Người chăm sóc mẫu UI',
        confirmedAt: now,
      })
      .onConflictDoNothing();
  const stored = await tx
    .select({ id: reminders.id, slot: reminders.slot })
    .from(reminders)
    .where(and(eq(reminders.healthProfileId, profileId), eq(reminders.date, date)));
  return {
    confirmed: stored.find((r) => r.slot === 'morning')!.id,
    pending: stored.find((r) => r.slot === 'evening')!.id,
  };
}
