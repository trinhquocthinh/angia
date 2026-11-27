import { createInvitationVerifier } from '@src/features/account/infrastructure/createInvitationVerifier.js';
import { createProfileGuardianRepository } from '@src/features/profiles/guardians/infrastructure/createProfileGuardianRepository.js';
import { createHouseholdDeletionRepository } from './createHouseholdDeletionRepository.js';
import { createHouseholdOwnershipRepository } from './createHouseholdOwnershipRepository.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { createHouseholdRepository } from './createHouseholdRepository.js';
import { createHouseholdMembershipRepository } from './createHouseholdMembershipRepository.js';
import { createHouseholdInvitationRepository } from './createHouseholdInvitationRepository.js';
import { createInvitationAcceptanceRepository } from './createInvitationAcceptanceRepository.js';
import { createFoundingInvitationRepository } from './createFoundingInvitationRepository.js';

export function createHouseholdDependencies(db: Database, appBaseUrl: string, invitationSecret: string) {
  return {
    profileGuardians: createProfileGuardianRepository(db),
    householdDeletion: createHouseholdDeletionRepository(db),
    householdOwnership: createHouseholdOwnershipRepository(db),
    household: createHouseholdRepository(db),
    householdMembership: createHouseholdMembershipRepository(db),
    householdInvitations: {
      repository: createHouseholdInvitationRepository(db, invitationSecret),
      appBaseUrl,
    },
    invitationAcceptance: {
      inspection: createInvitationVerifier(db),
      acceptance: createInvitationAcceptanceRepository(db),
      founding: createFoundingInvitationRepository(db),
      appBaseUrl,
    },
  };
}
