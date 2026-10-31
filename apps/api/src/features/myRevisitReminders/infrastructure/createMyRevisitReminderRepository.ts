import { and, asc, eq, sql } from 'drizzle-orm';
import { listFamilyAccounts } from '@src/features/reminders/infrastructure/listFamilyAccounts.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles, prescriptions, revisitReminders } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MyRevisitReminderRepository } from '../application/ports.js';

export function createMyRevisitReminderRepository(db: Database): MyRevisitReminderRepository {
  return {
    load: (familyId, reminderId) =>
      withFamilyScope(db, familyId, async (tx) => {
        const [row] = await tx
          .select({
            id: revisitReminders.id,
            revisitDate: sql<string>`${revisitReminders.revisitDate}::text`,
            offset: revisitReminders.offsetKind,
            profileId: healthProfiles.id,
            profileName: healthProfiles.displayName,
            consentStatus: healthProfiles.consentStatus,
          })
          .from(revisitReminders)
          .innerJoin(
            healthProfiles,
            and(
              eq(healthProfiles.id, revisitReminders.healthProfileId),
              eq(healthProfiles.familyId, revisitReminders.familyId),
            ),
          )
          .where(and(eq(revisitReminders.familyId, familyId), eq(revisitReminders.id, reminderId)));
        if (!row) return null;
        const items = await tx
          .select({
            id: prescriptions.id,
            issuedDate: sql<string>`${prescriptions.issuedDate}::text`,
            facility: prescriptions.facility,
          })
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.familyId, familyId),
              eq(prescriptions.healthProfileId, row.profileId),
              eq(prescriptions.revisitDate, row.revisitDate),
            ),
          )
          .orderBy(asc(prescriptions.issuedDate), asc(prescriptions.id));
        const { consentStatus, ...reminder } = row;
        return {
          reminder: { ...reminder, prescriptions: items },
          consentConfirmed: consentStatus === 'confirmed',
          familyAccounts: await listFamilyAccounts(tx, familyId),
        };
      }),
  };
}
