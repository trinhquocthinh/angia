import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdOwnershipRepository } from './ownershipPorts.js';

export async function getCurrentHouseholdOwnershipOffer(
  repository: Pick<HouseholdOwnershipRepository, 'current'>,
  actor: MembershipActor,
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  const result = await repository.current({ ...actor, familyId: actor.familyId });
  if (!result.ok) return result;
  return { ok: true, value: { ...result.offer, createdAt: result.offer.createdAt.toISOString() } } as const;
}
