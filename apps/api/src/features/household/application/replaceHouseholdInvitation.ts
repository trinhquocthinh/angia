import type { HouseholdInvitationDependencies, InvitationActor } from './invitationPorts.js';
export async function replaceHouseholdInvitation(
  deps: HouseholdInvitationDependencies,
  actor: InvitationActor,
  id: string,
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await deps.repository.replace({ ...actor, familyId: actor.familyId }, id);
  if (!result.ok) return result;
  const { token, ...value } = result.value;
  return {
    ok: true,
    value: {
      ...value,
      link: `${deps.appBaseUrl.replace(/\/$/, '')}/invite#token=${encodeURIComponent(token)}`,
    },
  } as const;
}
