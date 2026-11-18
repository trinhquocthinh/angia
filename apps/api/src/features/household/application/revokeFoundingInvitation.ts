import type { FoundingInvitationActor, FoundingInvitationRepository } from './acceptancePorts.js';

export function revokeFoundingInvitation(
  repository: FoundingInvitationRepository,
  actor: FoundingInvitationActor,
  invitationId: string,
) {
  if (!actor.isSystemAdmin || actor.authMethod !== 'oidc')
    return Promise.resolve({ ok: false, code: 'ERR_FORBIDDEN' } as const);
  return repository.revoke(actor.accountId, invitationId);
}
