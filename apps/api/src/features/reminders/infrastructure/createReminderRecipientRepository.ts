import { listEffectiveRecipientIds } from './listEffectiveRecipientIds.js';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles, reminderRecipients } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ReminderRecipientRepository } from '../application/recipientPorts.js';
import { listFamilyAccounts } from './listFamilyAccounts.js';

// RLS qua withFamilyScope cho hồ sơ và người nhận; bảng accounts không RLS nên luôn lọc family_id tường
// minh. Khóa dòng hồ sơ (FOR UPDATE) tuần tự hóa hai lệnh lưu đồng thời.
export function createReminderRecipientRepository(db: Database): ReminderRecipientRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => {
        const ofProfile = (profileId: string) =>
          and(eq(reminderRecipients.healthProfileId, profileId), eq(reminderRecipients.familyId, familyId));
        return work({
          findProfile: async (id) =>
            (
              await tx
                .select({
                  consentStatus: healthProfiles.consentStatus,
                  guardianManaged: sql<boolean>`COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - ${healthProfiles.birthYear} < 18, false) AND NOT EXISTS (SELECT 1 FROM accounts WHERE health_profile_id=${healthProfiles.id})`,
                })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId)))
                .for('update')
            )[0] ?? null,
          listFamilyAccounts: () => listFamilyAccounts(tx, familyId),
          listRecipientIds: (profileId) => listEffectiveRecipientIds(tx, familyId, profileId),
          replaceRecipients: async (profileId, accountIds) => {
            await tx.delete(reminderRecipients).where(ofProfile(profileId));
            await tx
              .insert(reminderRecipients)
              .values(accountIds.map((accountId) => ({ healthProfileId: profileId, familyId, accountId })));
          },
        });
      }),
  };
}
