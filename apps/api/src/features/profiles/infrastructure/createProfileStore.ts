import { PURGE_PROFILE_OBJECTS_DELAY_SECONDS, PURGE_PROFILE_OBJECTS_QUEUE } from '@angia/contracts';
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import { accounts, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { ProfileStore } from '../application/ports.js';

// Mọi thao tác dùng transaction đã có SET LOCAL app.family_id; bộ lọc bổ sung phòng thủ theo chiều sâu.
export function createProfileStore(tx: FamilyScopedTx, familyId: string, boss: PgBoss): ProfileStore {
  const sameAccount = (id: string) => and(eq(accounts.id, id), eq(accounts.familyId, familyId));
  const sameProfile = (id: string) => and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId));
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
    lockProfile: async (id) =>
      (
        await tx
          .select({ id: healthProfiles.id, displayName: healthProfiles.displayName })
          .from(healthProfiles)
          .where(sameProfile(id))
          .for('update')
      )[0] ?? null,
    // FK ON DELETE CASCADE xóa mọi dữ liệu phụ thuộc; accounts.health_profile_id → NULL (BR-010).
    deleteProfile: async (id) => {
      await tx.delete(healthProfiles).where(sameProfile(id));
    },
    // Cùng transaction: COMMIT thì job chắc chắn có, rollback thì không (SPEC-007).
    enqueuePurge: async (job) => {
      const jobId = await boss.send(PURGE_PROFILE_OBJECTS_QUEUE, job, {
        db: toPgBossDb(tx),
        startAfter: PURGE_PROFILE_OBJECTS_DELAY_SECONDS,
      });
      if (!jobId) throw new Error('Không tạo được việc dọn ảnh hồ sơ');
    },
  };
}
