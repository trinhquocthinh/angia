import type { MembershipActor } from './membershipPorts.js';
import type { DeletionRevokeResult, HouseholdDeletionRepository } from './deletionPorts.js';

export async function revokeHouseholdDeletion(
  repository: HouseholdDeletionRepository,
  actor: MembershipActor,
  requestId: string,
): Promise<DeletionRevokeResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.revoke({ ...actor, familyId: actor.familyId }, requestId);
}
