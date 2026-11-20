import type { HouseholdMembersReader, MembershipActor } from './membershipPorts.js';

export async function listHouseholdMembers(repository: HouseholdMembersReader, actor: MembershipActor) {
  if (!actor.familyId) return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await repository.list({ ...actor, familyId: actor.familyId });
  if (!result.ok) return result;
  return { ok: true, value: { members: result.value } } as const;
}
