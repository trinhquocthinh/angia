import { canUnlinkStoredProfile } from '@src/features/profiles/guardians/infrastructure/canUnlinkStoredProfile.js';
import { asc, eq, or } from 'drizzle-orm';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { MembershipActor } from '../application/membershipPorts.js';
import type { HouseholdLeaveInput } from '../application/leavePorts.js';

export async function lockHouseholdLeave(
  tx: FamilyScopedTx,
  actor: MembershipActor & { familyId: string },
  input: HouseholdLeaveInput,
) {
  // Cùng thứ tự với SPEC-066: account theo UUID → family → profile.
  const members = await tx
    .select()
    .from(accounts)
    .where(or(eq(accounts.familyId, actor.familyId), eq(accounts.id, actor.accountId)))
    .orderBy(asc(accounts.id))
    .for('update');
  const caller = members.find((row) => row.id === actor.accountId);
  if (!caller || caller.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' } as const;
  if (caller.familyId !== actor.familyId || caller.isSystemAdmin)
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const [family] = await tx
    .select({ ownerId: families.ownerAccountId })
    .from(families)
    .where(eq(families.id, actor.familyId))
    .for('update');
  if (!family) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  if (family.ownerId === caller.id)
    return {
      ok: false,
      code: members.some((row) => row.id !== caller.id && row.familyId === actor.familyId)
        ? 'ERR_OWNER_MUST_TRANSFER'
        : 'ERR_OWNER_MUST_DELETE_FAMILY',
    } as const;
  if (caller.healthProfileId && !input.ownProfileDisposition)
    return { ok: false, code: 'ERR_VALIDATION' } as const;
  if (
    caller.healthProfileId &&
    input.ownProfileDisposition === 'keep' &&
    !(await canUnlinkStoredProfile(tx, actor.familyId, caller.healthProfileId))
  )
    return { ok: false, code: 'ERR_VALIDATION' } as const;
  return { ok: true, caller } as const;
}
