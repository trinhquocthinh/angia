import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import {
  doseConfirmations,
  healthProfiles,
  prescriptions,
  revisitReminders,
} from '../../apps/api/src/shared/db/schema/index.js';
import { reminderSeedId } from './reminderSeedId.js';
import { seedReminderMedicationData } from './seedReminderMedicationData.js';
import { seedReminderRevisitData } from './seedReminderRevisitData.js';

export async function seedLinkedReminderProfiles(
  tx: FamilyScopedTx,
  familyId: string,
  actors: { id: string; username: string | null; role: string | null; profileId: string | null }[],
  date: string,
  now: Date,
) {
  const links = [];
  for (const actor of actors.filter((a) => a.role === 'member')) {
    if (!actor.profileId) throw new Error('Thành viên phải có hồ sơ liên kết.');
    const [profile] = await tx
      .select({ id: healthProfiles.id, displayName: healthProfiles.displayName })
      .from(healthProfiles)
      .where(and(eq(healthProfiles.id, actor.profileId), eq(healthProfiles.consentStatus, 'confirmed')));
    if (!profile) throw new Error('Hồ sơ liên kết cần có đồng thuận trước khi seed.');
    const detail = await seedReminderMedicationData(tx, familyId, profile.id, [], date, now);
    await tx
      .insert(doseConfirmations)
      .values({
        id: reminderSeedId(profile.id, `${date}-linked-confirmation`),
        familyId,
        healthProfileId: profile.id,
        date,
        slot: 'morning',
        reminderId: detail.confirmed,
        confirmedByAccountId: actor.id,
        confirmedByName: profile.displayName,
        confirmedAt: now,
      })
      .onConflictDoNothing();
    const [existingRx] = await tx
      .select({ revisitDate: sql<string>`${prescriptions.revisitDate}::text` })
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.familyId, familyId),
          eq(prescriptions.healthProfileId, profile.id),
          isNotNull(prescriptions.revisitDate),
        ),
      )
      .orderBy(asc(prescriptions.revisitDate))
      .limit(1);
    const revisitId = existingRx
      ? await ensureExistingRevisitReminder(tx, familyId, profile.id, existingRx.revisitDate, now)
      : await seedReminderRevisitData(tx, familyId, profile.id, date, now);
    links.push({
      username: actor.username,
      pending: `/reminders/${detail.pending}`,
      confirmed: `/reminders/${detail.confirmed}`,
      revisit: `/revisit-reminders/${revisitId}`,
      settingsForMain: `/profiles/${profile.id}/reminders`,
    });
  }
  return links;
}

async function ensureExistingRevisitReminder(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  revisitDate: string,
  now: Date,
) {
  const [existing] = await tx
    .select({ id: revisitReminders.id })
    .from(revisitReminders)
    .where(
      and(
        eq(revisitReminders.familyId, familyId),
        eq(revisitReminders.healthProfileId, profileId),
        eq(revisitReminders.revisitDate, revisitDate),
      ),
    )
    .limit(1);
  if (existing) return existing.id;
  const id = reminderSeedId(profileId, `${revisitDate}-linked-revisit`);
  await tx
    .insert(revisitReminders)
    .values({
      id,
      familyId,
      healthProfileId: profileId,
      revisitDate,
      offsetKind: 'same_day',
      sendDate: revisitDate,
      scheduledAt: new Date(`${revisitDate}T06:00:00+07:00`),
      sentAt: now,
    })
    .onConflictDoNothing();
  return id;
}
