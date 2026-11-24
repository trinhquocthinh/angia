import { readHouseholdMembers } from './readHouseholdMembers.js';
import { canUnlinkStoredProfile } from '@src/features/profiles/guardians/infrastructure/canUnlinkStoredProfile.js';
import { revokeMemberOwnershipOffers } from './revokeMemberOwnershipOffers.js';
import { eq } from 'drizzle-orm';
import { lockFamilyMemberChange } from '@src/shared/auth/infrastructure/lockFamilyMemberChange.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdMembershipRepository } from '../application/membershipPorts.js';
import { releaseMemberGuardians } from './releaseMemberGuardians.js';
import { removeStoredHouseholdMember } from './removeStoredHouseholdMember.js';

export function createHouseholdMembershipRepository(db: Database): HouseholdMembershipRepository {
  return {
    list: (actor) => withFamilyScope(db, actor.familyId, (tx) => readHouseholdMembers(tx, actor)),
    change: (actor, targetId, change) =>
      withFamilyScope(db, actor.familyId, async (tx) => {
        const permission = await lockFamilyMemberChange(tx, actor, targetId);
        if (!permission.ok) return permission;
        const { target } = permission;
        if (
          change.action === 'remove' &&
          target.healthProfileId &&
          !(await canUnlinkStoredProfile(tx, actor.familyId, target.healthProfileId))
        )
          return { ok: false, code: 'ERR_VALIDATION' };
        if (change.action === 'remove' || change.role === 'member') {
          const guardians = await releaseMemberGuardians(tx, actor.familyId, targetId);
          if (!guardians.ok) return guardians;
        }
        if (change.action === 'remove' || change.role === 'member')
          await revokeMemberOwnershipOffers(tx, actor.familyId, targetId, actor.accountId);
        const at = new Date();
        if (change.action === 'remove') await removeStoredHouseholdMember(tx, actor, target, at);
        else await tx.update(accounts).set({ familyRole: change.role }).where(eq(accounts.id, targetId));
        await writeAdminAuditEvent(tx, {
          actorAccountId: actor.accountId,
          familyId: actor.familyId,
          targetAccountId: targetId,
          ...(target.healthProfileId ? { targetProfileId: target.healthProfileId } : {}),
          action: change.action === 'remove' ? 'member_removed' : 'member_role_changed',
        });
        return { ok: true };
      }),
  };
}
