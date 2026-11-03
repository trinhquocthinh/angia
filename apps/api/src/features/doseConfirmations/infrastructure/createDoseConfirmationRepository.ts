import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { doseConfirmations, healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DoseConfirmationRepository } from '../application/ports.js';
import { listDayReminderRows } from './listDayReminderRows.js';
import { loadDoseAudience } from './loadDoseAudience.js';
import { lockReminderForConfirmation } from './lockReminderForConfirmation.js';

export function createDoseConfirmationRepository(db: Database): DoseConfirmationRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          lockReminder: (reminderId) => lockReminderForConfirmation(tx, familyId, reminderId),
          insert: async (reminder, accountId, displayName, confirmedAt) => {
            await tx.insert(doseConfirmations).values({
              familyId,
              healthProfileId: reminder.profileId,
              date: reminder.date,
              slot: reminder.slot,
              reminderId: reminder.id,
              confirmedByAccountId: accountId,
              confirmedByName: displayName,
              confirmedAt,
            });
            return {
              profileId: reminder.profileId,
              date: reminder.date,
              slot: reminder.slot,
              confirmedBy: { accountId, displayName },
              confirmedAt: confirmedAt.toISOString(),
            };
          },
          remove: async (reminder) => {
            await tx
              .delete(doseConfirmations)
              .where(
                and(
                  eq(doseConfirmations.healthProfileId, reminder.profileId),
                  eq(doseConfirmations.date, reminder.date),
                  eq(doseConfirmations.slot, reminder.slot),
                ),
              );
          },
        }),
      ),
    withProfileDay: (familyId, profileId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          consentStatus: async () => {
            const [profile] = await tx
              .select({ consentStatus: healthProfiles.consentStatus })
              .from(healthProfiles)
              .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)));
            return profile?.consentStatus ?? null;
          },
          audience: () => loadDoseAudience(tx, familyId, profileId),
          reminders: (date) => listDayReminderRows(tx, familyId, profileId, date),
        }),
      ),
  };
}
