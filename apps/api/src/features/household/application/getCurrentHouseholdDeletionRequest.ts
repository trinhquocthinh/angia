import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdDeletionRepository } from './deletionPorts.js';

export async function getCurrentHouseholdDeletionRequest(
  repository: Pick<HouseholdDeletionRepository, 'current'>,
  actor: MembershipActor,
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await repository.current({ ...actor, familyId: actor.familyId });
  if (!result.ok) return result;
  return {
    ok: true,
    value: { ...result.request, executeAt: result.request.executeAt.toISOString() },
  } as const;
}
