import type { HouseholdInvitationDependencies, InvitationActor } from './invitationPorts.js';

export async function createHouseholdInvitation(
  deps: HouseholdInvitationDependencies,
  actor: InvitationActor,
  input: { kind: 'join_family'; role: 'main' | 'member' },
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await deps.repository.create({ ...actor, familyId: actor.familyId }, input.role);
  if (!result.ok) return result;
  const { invitationId, token, code, expiresAt } = result.value;
  const base = deps.appBaseUrl.replace(/\/$/, '');
  return {
    ok: true,
    value: {
      invitationId,
      link: `${base}/invite#token=${encodeURIComponent(token)}`,
      code,
      expiresAt,
    },
  } as const;
}
