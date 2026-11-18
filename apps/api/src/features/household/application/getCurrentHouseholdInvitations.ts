import type { HouseholdInvitationDependencies, InvitationActor } from './invitationPorts.js';
export async function getCurrentHouseholdInvitations(
  deps: HouseholdInvitationDependencies,
  actor: InvitationActor,
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await deps.repository.current({ ...actor, familyId: actor.familyId });
  if (!result.ok) return result;
  return {
    ok: true,
    value: {
      items: result.value.map(({ token, ...item }) => ({
        ...item,
        expiresAt: item.expiresAt.toISOString(),
        link: token
          ? `${deps.appBaseUrl.replace(/\/$/, '')}/invite#token=${encodeURIComponent(token)}`
          : null,
      })),
    },
  } as const;
}
