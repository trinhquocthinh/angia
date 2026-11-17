import type { Database } from '@src/shared/db/createDatabase.js';
import { createHouseholdRepository } from './createHouseholdRepository.js';
import { createHouseholdInvitationRepository } from './createHouseholdInvitationRepository.js';
import { createInvitationAcceptanceRepository } from './createInvitationAcceptanceRepository.js';
import { createFoundingInvitationRepository } from './createFoundingInvitationRepository.js';

export function createHouseholdDependencies(db: Database, appBaseUrl: string) {
  return {
    household: createHouseholdRepository(db),
    householdInvitations: { repository: createHouseholdInvitationRepository(db), appBaseUrl },
    invitationAcceptance: {
      acceptance: createInvitationAcceptanceRepository(db),
      founding: createFoundingInvitationRepository(db),
      appBaseUrl,
    },
  };
}
