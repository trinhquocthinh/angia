import type { GuardianActor, GuardianResult, ProfileGuardianRepository } from './ports.js';
export async function removeOwnProfileGuardian(
  repository: ProfileGuardianRepository,
  actor: GuardianActor,
  profileId: string,
): Promise<GuardianResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.change({ ...actor, familyId: actor.familyId }, profileId, null);
}
