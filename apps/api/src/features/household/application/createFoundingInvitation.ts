import type { FoundingInvitationActor, FoundingInvitationRepository } from './acceptancePorts.js';

export async function createFoundingInvitation(
  repository: FoundingInvitationRepository,
  actor: FoundingInvitationActor,
  appBaseUrl: string,
) {
  if (!actor.isSystemAdmin || actor.authMethod !== 'oidc')
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await repository.create(actor.accountId);
  if (!result.ok) return result;
  const { invitationId, token, code, expiresAt } = result.value;
  return {
    ok: true,
    value: {
      invitationId,
      link: `${appBaseUrl.replace(/\/$/, '')}/invite#token=${encodeURIComponent(token)}`,
      code,
      expiresAt,
    },
  } as const;
}
