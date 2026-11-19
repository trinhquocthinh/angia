import { readHouseholdMembers } from './readHouseholdMembers.js';
import { canUnlinkStoredProfile } from '@src/features/profiles/guardians/infrastructure/canUnlinkStoredProfile.js';
import { revokeMemberOwnershipOffers } from './revokeMemberOwnershipOffers.js';
import { asc, eq, or } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, families } from '@src/shared/db/schema/index.js';
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
        // Khoá account theo UUID trước family, cùng thứ tự account → family của quản lý lời mời.
        // Khoá cả nhà vì trigger giám hộ còn cập nhật phiên bản account của người giám hộ khác.
        const members = await tx
          .select()
          .from(accounts)
          .where(or(eq(accounts.familyId, actor.familyId), eq(accounts.id, actor.accountId)))
          .orderBy(asc(accounts.id))
          .for('update');
        const caller = members.find((row) => row.id === actor.accountId);
        if (!caller || caller.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' };
        if (
          caller.familyId !== actor.familyId ||
          caller.familyRole !== 'main' ||
          caller.isSystemAdmin ||
          targetId === actor.accountId
        )
          return { ok: false, code: 'ERR_FORBIDDEN' };
        const [family] = await tx
          .select({ ownerId: families.ownerAccountId })
          .from(families)
          .where(eq(families.id, actor.familyId))
          .for('update');
        const target = members.find((row) => row.id === targetId && row.familyId === actor.familyId);
        if (!family || !target) return { ok: false, code: 'ERR_NOT_FOUND' };
        if (family.ownerId === targetId) return { ok: false, code: 'ERR_OWNER_PROTECTED' };
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
