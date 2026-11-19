import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdOwnershipRepository, OwnershipOfferResult } from './ownershipPorts.js';

export async function offerHouseholdOwnership(
  repository: HouseholdOwnershipRepository,
  actor: MembershipActor,
  targetAccountId: string,
): Promise<OwnershipOfferResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.offer({ ...actor, familyId: actor.familyId }, targetAccountId);
}
