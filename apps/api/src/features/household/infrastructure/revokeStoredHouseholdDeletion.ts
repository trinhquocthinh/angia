import { and, eq } from 'drizzle-orm';
import { familyDeletionRequests } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { DeletionActor, DeletionRevokeResult } from '../application/deletionPorts.js';

// Khoá dòng yêu cầu như job execute-family-deletion: thu hồi và thực thi không cùng thắng.
export async function revokeStoredHouseholdDeletion(
  tx: FamilyScopedTx,
  actor: DeletionActor,
  requestId: string,
  now: Date,
): Promise<DeletionRevokeResult> {
  const [request] = await tx
    .select()
    .from(familyDeletionRequests)
    .where(and(eq(familyDeletionRequests.id, requestId), eq(familyDeletionRequests.familyId, actor.familyId)))
    .for('update');
  if (!request) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (request.requestedBy !== actor.accountId) return { ok: false, code: 'ERR_FORBIDDEN' };
  // Quá executeAt là việc của job: không thu hồi muộn dù job chưa kịp chạy.
  if (request.status !== 'pending' || request.executeAt <= now) return { ok: false, code: 'ERR_NOT_FOUND' };
  await tx
    .update(familyDeletionRequests)
    .set({ status: 'revoked', revokedAt: now })
    .where(eq(familyDeletionRequests.id, requestId));
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    action: 'family_deletion_revoked',
  });
  return { ok: true };
}
