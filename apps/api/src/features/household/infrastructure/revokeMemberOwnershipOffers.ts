import { and, eq, or } from 'drizzle-orm';
import { ownershipTransferOffers } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';

// Gọi sau kiểm tra quyền/giám hộ, trong transaction đang giữ khoá account → family.
export async function revokeMemberOwnershipOffers(
  tx: FamilyScopedTx,
  familyId: string,
  memberId: string,
  actorAccountId: string,
) {
  const offers = await tx
    .update(ownershipTransferOffers)
    .set({ status: 'revoked', decidedAt: new Date() })
    .where(
      and(
        eq(ownershipTransferOffers.familyId, familyId),
        eq(ownershipTransferOffers.status, 'pending'),
        or(
          eq(ownershipTransferOffers.fromAccountId, memberId),
          eq(ownershipTransferOffers.toAccountId, memberId),
        ),
      ),
    )
    .returning({ targetId: ownershipTransferOffers.toAccountId });
  for (const offer of offers)
    await writeAdminAuditEvent(tx, {
      actorAccountId,
      familyId,
      targetAccountId: offer.targetId,
      action: 'ownership_transfer_revoked',
    });
}
