import { and, eq } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, pushSubscriptions, removedMemberWindows } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import { createProfileStore } from '../../profiles/infrastructure/createProfileStore.js';
import type { HouseholdLeaveRepository } from '../application/leavePorts.js';
import { lockHouseholdLeave } from './lockHouseholdLeave.js';
import { releaseMemberGuardians } from './releaseMemberGuardians.js';

export function createHouseholdLeaveRepository(db: Database, boss: PgBoss): HouseholdLeaveRepository {
  return {
    leave: (actor, input) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const locked = await lockHouseholdLeave(tx, actor, input);
        if (!locked.ok) return locked;
        const profileId = locked.caller.healthProfileId;
        const store = createProfileStore(tx, actor.familyId, boss);
        if (profileId && !(await store.lockProfile(profileId)))
          throw new Error('Hồ sơ liên kết không thuộc nhà đã kiểm chứng');
        const guardians = await releaseMemberGuardians(tx, actor.familyId, actor.accountId);
        if (!guardians.ok) return guardians;
        const deletedProfileId = input.ownProfileDisposition === 'delete' ? profileId : null;
        if (deletedProfileId) {
          // Cửa sổ lịch sử giữ thời hạn nhưng không tham chiếu hồ sơ đã bị chủ thể xoá.
          await tx
            .update(removedMemberWindows)
            .set({ healthProfileId: null })
            .where(
              and(
                eq(removedMemberWindows.familyId, actor.familyId),
                eq(removedMemberWindows.healthProfileId, deletedProfileId),
              ),
            );
          await store.deleteProfile(deletedProfileId);
          await store.enqueuePurge({ familyId: actor.familyId, profileId: deletedProfileId });
        }
        await tx
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.familyId, actor.familyId),
              eq(pushSubscriptions.accountId, actor.accountId),
            ),
          );
        await tx
          .update(accounts)
          .set({ familyId: null, familyRole: null, healthProfileId: null })
          .where(and(eq(accounts.id, actor.accountId), eq(accounts.familyId, actor.familyId)));
        await writeAdminAuditEvent(tx, {
          actorAccountId: actor.accountId,
          familyId: actor.familyId,
          targetAccountId: actor.accountId,
          ...(profileId ? { targetProfileId: profileId } : {}),
          action: 'member_left',
        });
        return { ok: true, ...(deletedProfileId ? { deletedProfileId } : {}) };
      }),
  };
}
