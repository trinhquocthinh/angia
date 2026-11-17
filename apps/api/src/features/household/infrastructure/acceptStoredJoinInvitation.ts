import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  accounts,
  adminAuditEvents,
  families,
  familyDeletionRequests,
  familyInvitations,
} from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AcceptInvitationOutcome } from '../application/acceptancePorts.js';
import { lookupJoinInvitation } from './lookupJoinInvitation.js';

// Bên gọi đã khoá account và đặt scope từ kết quả tra hash, cùng transaction.
export async function acceptStoredJoinInvitation(
  tx: FamilyScopedTx,
  accountId: string,
  digest: string,
  invitation: { id: string; family_id: string },
): Promise<AcceptInvitationOutcome> {
  const [family] = await tx
    .select({ id: families.id })
    .from(families)
    .where(eq(families.id, invitation.family_id))
    .for('update');
  if (!family) return { ok: false, code: 'ERR_NOT_FOUND' };
  const [locked] = await tx
    .select({ id: familyInvitations.id })
    .from(familyInvitations)
    .where(eq(familyInvitations.id, invitation.id))
    .for('update');
  if (!locked) return { ok: false, code: 'ERR_NOT_FOUND' };
  const current = await lookupJoinInvitation(tx, digest);
  if (!current || current.id !== invitation.id || current.family_id !== family.id)
    return { ok: false, code: 'ERR_NOT_FOUND' };
  const [pending] = await tx
    .select({ id: familyDeletionRequests.id })
    .from(familyDeletionRequests)
    .where(and(eq(familyDeletionRequests.familyId, family.id), eq(familyDeletionRequests.status, 'pending')))
    .limit(1);
  if (pending) return { ok: false, code: 'ERR_DELETION_PENDING' };
  const [claimed] = await tx
    .update(familyInvitations)
    .set({ acceptedAt: sql`clock_timestamp()`, acceptedBy: accountId })
    .where(
      and(
        eq(familyInvitations.id, current.id),
        isNull(familyInvitations.acceptedAt),
        isNull(familyInvitations.revokedAt),
        sql`${familyInvitations.expiresAt} > clock_timestamp()`,
      ),
    )
    .returning({ id: familyInvitations.id });
  if (!claimed) return { ok: false, code: 'ERR_NOT_FOUND' };
  await tx
    .update(accounts)
    .set({ familyId: family.id, familyRole: current.role })
    .where(eq(accounts.id, accountId));
  await tx.insert(adminAuditEvents).values({
    actorAccountId: accountId,
    familyId: family.id,
    targetAccountId: accountId,
    action: 'invitation_accepted',
    metadata: {},
  });
  return { ok: true, familyId: family.id };
}
