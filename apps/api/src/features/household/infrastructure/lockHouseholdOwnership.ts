import { asc, eq, or } from 'drizzle-orm';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { OwnershipActor } from '../application/ownershipPorts.js';

export async function lockHouseholdOwnership(tx: FamilyScopedTx, actor: OwnershipActor) {
  // Cùng thứ tự với đổi vai trò/gỡ/rời nhà: account theo UUID → family → offer.
  const members = await tx
    .select()
    .from(accounts)
    .where(or(eq(accounts.familyId, actor.familyId), eq(accounts.id, actor.accountId)))
    .orderBy(asc(accounts.id))
    .for('update');
  const caller = members.find((row) => row.id === actor.accountId);
  if (!caller || caller.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' } as const;
  if (caller.familyId !== actor.familyId || caller.familyRole !== 'main' || caller.isSystemAdmin)
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const [family] = await tx.select().from(families).where(eq(families.id, actor.familyId)).for('update');
  if (!family) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  return { ok: true, family, members } as const;
}
export type LockedOwnership = Extract<Awaited<ReturnType<typeof lockHouseholdOwnership>>, { ok: true }>;
