import { and, asc, eq, isNotNull } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, healthProfiles, reminderRecipients } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ReminderRecipientRepository } from '../application/recipientPorts.js';

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
          listFamilyAccounts: async () =>
            (
              await tx
                .select({
                  id: accounts.id,
                  displayName: accounts.displayName,
                  role: accounts.familyRole,
                  healthProfileId: accounts.healthProfileId,
                })
                .from(accounts)
                .where(and(eq(accounts.familyId, familyId), isNotNull(accounts.familyRole)))
                .orderBy(asc(accounts.createdAt), asc(accounts.id))
            ).map((a) => ({ ...a, role: a.role! })),
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
