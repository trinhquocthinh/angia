import { and, eq, isNull } from 'drizzle-orm';
import { accounts, consentInvitations, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ProfileStore } from '../application/ports.js';

// Cùng transaction/phạm vi gia đình; thao tác ghi chỉ gọi sau khi khóa hồ sơ.
export function createProfileConsentStore(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<
  ProfileStore,
  'listConsentAccounts' | 'findLinkedAccount' | 'saveConsentReceipt' | 'revokePendingInvitations'
> {
  return {
    listConsentAccounts: () =>
      tx
        .select({
          id: accounts.id,
          displayName: accounts.displayName,
          healthProfileId: accounts.healthProfileId,
        })
        .from(accounts)
        .where(eq(accounts.familyId, familyId)),
    findLinkedAccount: async (profileId) =>
      (
        await tx
          .select({ id: accounts.id, displayName: accounts.displayName })
          .from(accounts)
          .where(and(eq(accounts.familyId, familyId), eq(accounts.healthProfileId, profileId)))
      )[0] ?? null,
    saveConsentReceipt: async (profileId, receipt) => {
      const [profile] = await tx
        .update(healthProfiles)
        .set(receipt)
        .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)))
        .returning();
      if (!profile) throw new Error('Không lưu được bằng chứng đồng thuận');
      return profile;
    },
    revokePendingInvitations: async (profileId, at) => {
      await tx
        .update(consentInvitations)
        .set({ revokedAt: at })
        .where(
          and(
            eq(consentInvitations.familyId, familyId),
            eq(consentInvitations.profileId, profileId),
            isNull(consentInvitations.decision),
            isNull(consentInvitations.revokedAt),
          ),
        );
    },
  };
}
