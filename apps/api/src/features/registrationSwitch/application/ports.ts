import type { RegistrationGate } from '@src/features/account/application/ports.js';

export interface RegistrationSwitchActor {
  accountId: string;
  isSystemAdmin: boolean;
  authMethod: 'oidc' | 'local';
}

export interface RegistrationSwitchRepository {
  setOpen(actorAccountId: string, open: boolean): Promise<void>;
}

export interface RegistrationSwitchDependencies {
  repository: RegistrationSwitchRepository;
  gate: RegistrationGate;
}
