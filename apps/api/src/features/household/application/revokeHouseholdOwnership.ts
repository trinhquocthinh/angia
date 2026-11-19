import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdOwnershipRepository, OwnershipResult } from './ownershipPorts.js';

export async function revokeHouseholdOwnership(
  repository: HouseholdOwnershipRepository,
  actor: MembershipActor,
  offerId: string,
): Promise<OwnershipResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.revoke({ ...actor, familyId: actor.familyId }, offerId);
}
