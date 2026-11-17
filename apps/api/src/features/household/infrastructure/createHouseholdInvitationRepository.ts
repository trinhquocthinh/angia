import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdInvitationRepository } from '../application/invitationPorts.js';
import { insertHouseholdInvitation } from './insertHouseholdInvitation.js';
import { revokeStoredHouseholdInvitation } from './revokeStoredHouseholdInvitation.js';

export function createHouseholdInvitationRepository(db: Database): HouseholdInvitationRepository {
  return {
    create: (actor, role) =>
      withFamilyScope(db, actor.familyId, (tx) => insertHouseholdInvitation(tx, actor, role)),
    revoke: (actor, invitationId) =>
      withFamilyScope(db, actor.familyId, (tx) => revokeStoredHouseholdInvitation(tx, actor, invitationId)),
  };
}
