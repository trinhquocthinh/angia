import { and, eq } from 'drizzle-orm';
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
                .select({ consentStatus: healthProfiles.consentStatus })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId)))
                .for('update')
            )[0] ?? null,
          listFamilyAccounts: () => listFamilyAccounts(tx, familyId),
          listRecipientIds: async (profileId) =>
            (
              await tx
                .select({ accountId: reminderRecipients.accountId })
                .from(reminderRecipients)
                .where(ofProfile(profileId))
            ).map((r) => r.accountId),
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
