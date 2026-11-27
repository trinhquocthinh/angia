import type { RegistrationSwitchActor, RegistrationSwitchRepository } from './ports.js';

export async function setRegistrationSwitch(
  repository: RegistrationSwitchRepository,
  actor: RegistrationSwitchActor,
  open: boolean,
) {
  if (!actor.isSystemAdmin || actor.authMethod !== 'oidc')
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  await repository.setOpen(actor.accountId, open);
  return { ok: true, value: { registrationOpen: open } } as const;
}
