import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdOwnershipRepository, OwnershipResult } from './ownershipPorts.js';

export async function decideHouseholdOwnership(
  repository: HouseholdOwnershipRepository,
  actor: MembershipActor,
  offerId: string,
  accept: boolean,
): Promise<OwnershipResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.decide({ ...actor, familyId: actor.familyId }, offerId, accept);
}
