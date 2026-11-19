import { and, eq } from 'drizzle-orm';
import { familyDeletionRequests } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { DeletionActor, DeletionRequestResult } from '../application/deletionPorts.js';
import type { LockedOwnership } from './lockHouseholdOwnership.js';

const HOUR = 60 * 60 * 1000;
const DELETION_WAIT_MS = 24 * HOUR;
const RECENT_REMOVAL_MS = 7 * 24 * HOUR;

// SPEC-069: thứ tự kiểm theo SDD — nhà còn người khác, mới gỡ người, sai tên, đã có yêu cầu pending.
export async function requestStoredHouseholdDeletion(
  tx: FamilyScopedTx,
  actor: DeletionActor,
  confirmFamilyName: string,
  locked: LockedOwnership,
  now: Date,
): Promise<DeletionRequestResult> {
  const { family, members } = locked;
  if (family.ownerAccountId !== actor.accountId) return { ok: false, code: 'ERR_FORBIDDEN' };
  if (members.some((row) => row.familyId === actor.familyId && row.id !== actor.accountId))
    return { ok: false, code: 'ERR_FAMILY_NOT_EMPTY' };
  const allowedAt =
    family.lastMemberRemovedAt && new Date(family.lastMemberRemovedAt.getTime() + RECENT_REMOVAL_MS);
  if (allowedAt && allowedAt > now) return { ok: false, code: 'ERR_RECENT_REMOVAL', allowedAt };
  if (confirmFamilyName !== family.name) return { ok: false, code: 'ERR_VALIDATION' };
  const [pending] = await tx
    .select({ id: familyDeletionRequests.id })
    .from(familyDeletionRequests)
    .where(
      and(eq(familyDeletionRequests.familyId, actor.familyId), eq(familyDeletionRequests.status, 'pending')),
    );
  if (pending) return { ok: false, code: 'ERR_DELETION_PENDING' };
  const executeAt = new Date(now.getTime() + DELETION_WAIT_MS);
  const [row] = await tx
    .insert(familyDeletionRequests)
    .values({ familyId: actor.familyId, requestedBy: actor.accountId, executeAt })
    .returning({ id: familyDeletionRequests.id });
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    action: 'family_deletion_requested',
  });
  return { ok: true, request: { id: row!.id, status: 'pending', executeAt } };
}
