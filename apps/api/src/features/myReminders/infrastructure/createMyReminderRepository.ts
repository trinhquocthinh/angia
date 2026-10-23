import { and, eq, sql } from 'drizzle-orm';
import { listFamilyAccounts } from '@src/features/reminders/infrastructure/listFamilyAccounts.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles, reminderRecipients, reminders } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MyReminderRepository, StoredReminderMedication } from '../application/ports.js';

// SPEC-035: một transaction withFamilyScope (RLS) đọc lời nhắc + hồ sơ, tài khoản gia đình và người nhận
// đã lưu. `date` ép sang text trong SQL để không lệch ngày theo múi giờ của tiến trình.
export function createMyReminderRepository(db: Database): MyReminderRepository {
  return {
    load: (familyId, reminderId) =>
      withFamilyScope(db, familyId, async (tx) => {
        const [row] = await tx
          .select({
            id: reminders.id,
            date: sql<string>`${reminders.date}::text`,
            slot: reminders.slot,
            scheduledAt: reminders.scheduledAt,
            medications: reminders.medications,
            profileId: reminders.healthProfileId,
            profileName: healthProfiles.displayName,
            consentStatus: healthProfiles.consentStatus,
          })
          .from(reminders)
          .innerJoin(healthProfiles, eq(healthProfiles.id, reminders.healthProfileId))
          .where(and(eq(reminders.id, reminderId), eq(reminders.familyId, familyId)));
        if (!row) return null;
        const assigned = await tx
          .select({ accountId: reminderRecipients.accountId })
          .from(reminderRecipients)
          .where(
            and(
              eq(reminderRecipients.healthProfileId, row.profileId),
              eq(reminderRecipients.familyId, familyId),
            ),
          );
        const { consentStatus, scheduledAt, medications, ...reminder } = row;
        return {
          reminder: {
            ...reminder,
            scheduledAt: scheduledAt.toISOString(),
            medications: medications as StoredReminderMedication[],
            consentConfirmed: consentStatus === 'confirmed',
          },
          familyAccounts: await listFamilyAccounts(tx, familyId),
          assignedAccountIds: assigned.map((r) => r.accountId),
        };
      }),
  };
}
