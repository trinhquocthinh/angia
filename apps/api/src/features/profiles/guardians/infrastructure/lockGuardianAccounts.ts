import { asc, eq, or } from 'drizzle-orm';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Trigger giám hộ ghi account: khóa cả nhóm theo UUID trước family/profile, như luồng rời/gỡ.
export async function lockGuardianAccounts(tx: FamilyScopedTx, familyId: string, actorId?: string) {
  const members = await tx
    .select()
    .from(accounts)
    .where(
      actorId
        ? or(eq(accounts.familyId, familyId), eq(accounts.id, actorId))
        : eq(accounts.familyId, familyId),
    )
    .orderBy(asc(accounts.id))
    .for('update');
  const [family] = await tx
    .select({ id: families.id })
    .from(families)
    .where(eq(families.id, familyId))
    .for('update');
  const actor = members.find((a) => a.id === actorId);
  const allowed =
    !!family && !!actor && actor.familyId === familyId && actor.familyRole === 'main' && !actor.lockedAt;
  return { members, allowed };
}
