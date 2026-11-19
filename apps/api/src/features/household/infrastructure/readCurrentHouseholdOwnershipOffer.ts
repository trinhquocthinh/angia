import { and, eq, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { accounts, families, ownershipTransferOffers as offers } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { CurrentOwnershipOfferResult, OwnershipActor } from '../application/ownershipPorts.js';

export async function readCurrentHouseholdOwnershipOffer(
  tx: FamilyScopedTx,
  actor: OwnershipActor,
): Promise<CurrentOwnershipOfferResult> {
  const offeredBy = alias(accounts, 'offered_by');
  const target = alias(accounts, 'offer_target');
  // Kiểm lại thành viên, Chủ hộ và hai bên trong cùng snapshot; không đọc tên bằng N+1.
  const [offer] = await tx
    .select({
      id: offers.id,
      status: offers.status,
      createdAt: offers.createdAt,
      offeredBy: { accountId: offeredBy.id, displayName: offeredBy.displayName },
      target: { accountId: target.id, displayName: target.displayName },
    })
    .from(offers)
    .innerJoin(
      families,
      and(eq(families.id, offers.familyId), eq(families.ownerAccountId, offers.fromAccountId)),
    )
    .innerJoin(accounts, and(eq(accounts.id, actor.accountId), eq(accounts.familyId, offers.familyId)))
    .innerJoin(
      offeredBy,
      and(eq(offeredBy.id, offers.fromAccountId), eq(offeredBy.familyId, offers.familyId)),
    )
    .innerJoin(target, and(eq(target.id, offers.toAccountId), eq(target.familyId, offers.familyId)))
    .where(
      and(
        eq(offers.familyId, actor.familyId),
        eq(offers.status, 'pending'),
        or(eq(offers.fromAccountId, actor.accountId), eq(offers.toAccountId, actor.accountId)),
        eq(accounts.familyRole, 'main'),
        eq(accounts.isSystemAdmin, false),
        isNull(accounts.lockedAt),
        eq(offeredBy.familyRole, 'main'),
        eq(target.familyRole, 'main'),
      ),
    )
    .limit(1);
  if (!offer) return { ok: false, code: 'ERR_NOT_FOUND' };
  return { ok: true, offer: { ...offer, status: 'pending' } };
}
