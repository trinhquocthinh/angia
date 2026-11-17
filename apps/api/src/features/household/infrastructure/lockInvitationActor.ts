import { eq } from 'drizzle-orm';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ScopedInvitationActor } from '../application/invitationPorts.js';

// Cùng thứ tự account → family → invitation cho đường quản lý nhà.
export async function lockInvitationActor(tx: FamilyScopedTx, actor: ScopedInvitationActor) {
  const [account] = await tx
    .select({
      familyId: accounts.familyId,
      role: accounts.familyRole,
      lockedAt: accounts.lockedAt,
      admin: accounts.isSystemAdmin,
    })
    .from(accounts)
    .where(eq(accounts.id, actor.accountId))
    .for('update');
  if (!account || account.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' } as const;
  if (account.admin || account.familyId !== actor.familyId)
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const [family] = await tx
    .select({ id: families.id })
    .from(families)
    .where(eq(families.id, actor.familyId))
    .for('update');
  if (!family) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  return { ok: true, role: account.role } as const;
}
