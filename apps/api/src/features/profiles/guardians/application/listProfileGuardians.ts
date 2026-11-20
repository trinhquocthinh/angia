import type { GuardianActor, ListProfileGuardiansResult, ProfileGuardianRepository } from './ports.js';

export async function listProfileGuardians(
  repository: ProfileGuardianRepository,
  actor: GuardianActor,
  profileId: string,
): Promise<ListProfileGuardiansResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.list({ ...actor, familyId: actor.familyId }, profileId);
}
