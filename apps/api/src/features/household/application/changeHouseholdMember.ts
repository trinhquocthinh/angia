import type {
  HouseholdMembershipRepository,
  MemberChange,
  MembershipActor,
  MembershipResult,
} from './membershipPorts.js';

export async function changeHouseholdMember(
  repository: HouseholdMembershipRepository,
  actor: MembershipActor,
  targetId: string,
  change: MemberChange,
): Promise<MembershipResult> {
  if (!actor.familyId || actor.role !== 'main' || actor.accountId === targetId)
    return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.change({ ...actor, familyId: actor.familyId }, targetId, change);
}
