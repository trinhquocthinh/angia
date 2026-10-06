import { and, asc, eq, isNull } from 'drizzle-orm';
import { accounts, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ProfileStore } from '../application/ports.js';

// Mọi thao tác dùng transaction đã có SET LOCAL app.family_id; bộ lọc bổ sung phòng thủ theo chiều sâu.
export function createProfileStore(tx: FamilyScopedTx, familyId: string): ProfileStore {
  const sameAccount = (id: string) => and(eq(accounts.id, id), eq(accounts.familyId, familyId));
  return {
    listProfiles: () =>
      tx
        .select()
        .from(healthProfiles)
        .where(eq(healthProfiles.familyId, familyId))
        .orderBy(asc(healthProfiles.createdAt), asc(healthProfiles.id)),
    listLinkableAccounts: () =>
      tx
        .select({ id: accounts.id, displayName: accounts.displayName })
        .from(accounts)
        .where(and(eq(accounts.familyId, familyId), isNull(accounts.healthProfileId)))
        .orderBy(asc(accounts.displayName), asc(accounts.id)),
    lockAccount: async (id) =>
      (
        await tx
          .select({
            id: accounts.id,
            displayName: accounts.displayName,
            healthProfileId: accounts.healthProfileId,
          })
          .from(accounts)
          .where(sameAccount(id))
          .for('update')
      )[0] ?? null,
    insertProfile: async ({ displayName, birthYear }) => {
      const [profile] = await tx
        .insert(healthProfiles)
        .values({ familyId, displayName, birthYear: birthYear ?? null })
        .returning();
      if (!profile) throw new Error('Không tạo được hồ sơ');
      return profile;
    },
    linkAccount: async (id, profileId) => {
      await tx.update(accounts).set({ healthProfileId: profileId }).where(sameAccount(id));
    },
  };
}
