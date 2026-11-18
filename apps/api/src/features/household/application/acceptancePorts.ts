import type { IssuedHouseholdInvitation, InvitationFailure } from './invitationPorts.js';

export type AcceptInvitationOutcome =
  | { ok: true; familyId: string }
  | InvitationFailure
  | { ok: false; code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' | 'ERR_LEGAL_ACCEPTANCE_REQUIRED' };

export interface InvitationAcceptanceRepository {
  accept(accountId: string, token: string): Promise<AcceptInvitationOutcome>;
}

export interface FoundingInvitationActor {
  accountId: string;
  isSystemAdmin: boolean;
  authMethod: 'local' | 'oidc';
}

export interface FoundingInvitationRepository {
  create(
    accountId: string,
  ): Promise<{ ok: true; value: IssuedHouseholdInvitation } | { ok: false; code: 'ERR_FORBIDDEN' }>;
  revoke(
    accountId: string,
    invitationId: string,
  ): Promise<{ ok: true } | { ok: false; code: 'ERR_FORBIDDEN' | 'ERR_NOT_FOUND' }>;
}
