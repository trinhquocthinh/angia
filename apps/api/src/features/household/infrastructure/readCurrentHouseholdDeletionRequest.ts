import { and, eq } from 'drizzle-orm';
import { accounts, families, familyDeletionRequests as requests } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { CurrentDeletionRequestResult, DeletionActor } from '../application/deletionPorts.js';

export async function readCurrentHouseholdDeletionRequest(
  tx: FamilyScopedTx,
  actor: DeletionActor,
): Promise<CurrentDeletionRequestResult> {
  // LEFT JOIN giữ được phân biệt: không phải Chủ hộ → 403, Chủ hộ không có yêu cầu → 404.
  const [row] = await tx
    .select({
      ownerId: families.ownerAccountId,
      role: accounts.familyRole,
      admin: accounts.isSystemAdmin,
      lockedAt: accounts.lockedAt,
      request: { id: requests.id, requestedBy: requests.requestedBy, executeAt: requests.executeAt },
    })
    .from(accounts)
    .innerJoin(families, eq(families.id, accounts.familyId))
    .leftJoin(requests, and(eq(requests.familyId, families.id), eq(requests.status, 'pending')))
    .where(and(eq(accounts.id, actor.accountId), eq(accounts.familyId, actor.familyId)))
    .limit(1);
  if (row?.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' };
  if (!row || row.ownerId !== actor.accountId || row.role !== 'main' || row.admin)
    return { ok: false, code: 'ERR_FORBIDDEN' };
  if (!row.request) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (row.request.requestedBy !== actor.accountId) return { ok: false, code: 'ERR_FORBIDDEN' };
  const { id, executeAt } = row.request;
  return { ok: true, request: { id, status: 'pending', executeAt } };
}
