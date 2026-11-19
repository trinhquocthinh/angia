import { and, eq } from 'drizzle-orm';
import { ownershipTransferOffers } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { OwnershipActor, OwnershipOfferResult } from '../application/ownershipPorts.js';
import type { LockedOwnership } from './lockHouseholdOwnership.js';

export async function offerStoredHouseholdOwnership(
  tx: FamilyScopedTx,
  actor: OwnershipActor,
  targetId: string,
  locked: LockedOwnership,
): Promise<OwnershipOfferResult> {
  if (locked.family.ownerAccountId !== actor.accountId) return { ok: false, code: 'ERR_FORBIDDEN' };
  const target = locked.members.find((row) => row.id === targetId && row.familyId === actor.familyId);
  if (!target) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (target.id === actor.accountId || target.familyRole !== 'main' || target.isSystemAdmin)
    return { ok: false, code: 'ERR_VALIDATION' };
  const [pending] = await tx
    .select({ id: ownershipTransferOffers.id })
    .from(ownershipTransferOffers)
    .where(
      and(
        eq(ownershipTransferOffers.familyId, actor.familyId),
        eq(ownershipTransferOffers.status, 'pending'),
      ),
    );
  if (pending) return { ok: false, code: 'ERR_OWNERSHIP_TRANSFER_PENDING' };
  const [offer] = await tx
    .insert(ownershipTransferOffers)
    .values({
      familyId: actor.familyId,
      fromAccountId: actor.accountId,
      toAccountId: targetId,
    })
    .returning();
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    targetAccountId: targetId,
    action: 'ownership_transfer_offered',
  });
  return {
    ok: true,
    offer: { id: offer!.id, targetAccountId: targetId, status: 'pending', createdAt: offer!.createdAt },
  };
}
