import type { HouseholdInvitationDependencies, InvitationActor } from './invitationPorts.js';
export async function manageHouseholdInvitations(
  deps: HouseholdInvitationDependencies,
  actor: InvitationActor,
  offset: number,
) {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const result = await deps.repository.list({ ...actor, familyId: actor.familyId }, offset);
  if (!result.ok) return result;
  const base = deps.appBaseUrl.replace(/\/$/, '');
  return {
    ok: true,
    value: {
      ...result.value,
      items: result.value.items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        expiresAt: item.expiresAt.toISOString(),
        secrets: item.secrets
          ? {
              code: item.secrets.code,
              link: `${base}/invite#token=${encodeURIComponent(item.secrets.token)}`,
            }
          : null,
      })),
    },
  } as const;
}
