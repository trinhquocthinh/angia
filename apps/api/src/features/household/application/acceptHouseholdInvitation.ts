import type { InvitationAcceptanceRepository } from './acceptancePorts.js';

export function acceptHouseholdInvitation(
  repository: InvitationAcceptanceRepository,
  accountId: string,
  token: string,
) {
  return repository.accept(accountId, token);
}
