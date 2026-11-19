import { and, eq } from 'drizzle-orm';
import { families, ownershipTransferOffers } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { OwnershipActor, OwnershipResult } from '../application/ownershipPorts.js';
import type { LockedOwnership } from './lockHouseholdOwnership.js';

export async function decideStoredHouseholdOwnership(
  tx: FamilyScopedTx,
  actor: OwnershipActor,
  offerId: string,
  decision: 'accept' | 'decline' | 'revoke',
  locked: LockedOwnership,
): Promise<OwnershipResult> {
  const [offer] = await tx
    .select()
    .from(ownershipTransferOffers)
    .where(
      and(
        eq(ownershipTransferOffers.id, offerId),
        eq(ownershipTransferOffers.familyId, actor.familyId),
        eq(ownershipTransferOffers.status, 'pending'),
      ),
    )
    .for('update');
  if (!offer) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (
    decision === 'revoke'
      ? offer.fromAccountId !== actor.accountId || locked.family.ownerAccountId !== actor.accountId
      : offer.toAccountId !== actor.accountId
  )
    return { ok: false, code: 'ERR_FORBIDDEN' };
  const valid =
    locked.family.ownerAccountId === offer.fromAccountId &&
    [offer.fromAccountId, offer.toAccountId].every((id) =>
      locked.members.some(
        (row) =>
          row.id === id && row.familyId === actor.familyId && row.familyRole === 'main' && !row.isSystemAdmin,
      ),
    );
  const status =
    !valid || decision === 'revoke' ? 'revoked' : decision === 'accept' ? 'accepted' : 'declined';
  if (status === 'accepted')
    await tx
      .update(families)
      .set({ ownerAccountId: offer.toAccountId })
      .where(eq(families.id, actor.familyId));
  await tx
    .update(ownershipTransferOffers)
    .set({ status, decidedAt: new Date() })
    .where(
      and(eq(ownershipTransferOffers.id, offerId), eq(ownershipTransferOffers.familyId, actor.familyId)),
    );
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    targetAccountId: offer.toAccountId,
    action: `ownership_transfer_${status}`,
  });
  return valid ? { ok: true } : { ok: false, code: 'ERR_VALIDATION' };
}
