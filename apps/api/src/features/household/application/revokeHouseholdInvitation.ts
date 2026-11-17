import type { HouseholdInvitationRepository, InvitationActor } from './invitationPorts.js';

export async function revokeHouseholdInvitation(
  repository: HouseholdInvitationRepository,
  actor: InvitationActor,
  invitationId: string,
) {
  if (!actor.familyId) return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  return repository.revoke({ ...actor, familyId: actor.familyId }, invitationId);
}
