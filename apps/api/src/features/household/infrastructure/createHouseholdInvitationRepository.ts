import { readCurrentHouseholdInvitations } from './readCurrentHouseholdInvitations.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdInvitationRepository } from '../application/invitationPorts.js';
import { createInvitationSecretCipher } from './invitationSecretCipher.js';
import { listStoredHouseholdInvitations } from './listStoredHouseholdInvitations.js';
import { replaceStoredHouseholdInvitation } from './replaceStoredHouseholdInvitation.js';
import { insertHouseholdInvitation } from './insertHouseholdInvitation.js';
import { revokeStoredHouseholdInvitation } from './revokeStoredHouseholdInvitation.js';

export function createHouseholdInvitationRepository(
  db: Database,
  secret: string,
): HouseholdInvitationRepository {
  const cipher = createInvitationSecretCipher(secret);
  return {
    current: (actor) =>
      withFamilyScope(db, actor.familyId, (tx) => readCurrentHouseholdInvitations(tx, actor, cipher)),
    list: (actor, offset) =>
      withFamilyScope(db, actor.familyId, (tx) => listStoredHouseholdInvitations(tx, actor, offset, cipher)),
    replace: (actor, id) =>
      withFamilyScope(db, actor.familyId, (tx) => replaceStoredHouseholdInvitation(tx, actor, id, cipher)),
    create: (actor, role) =>
      withFamilyScope(db, actor.familyId, (tx) => insertHouseholdInvitation(tx, actor, role, cipher)),
    revoke: (actor, invitationId) =>
      withFamilyScope(db, actor.familyId, (tx) => revokeStoredHouseholdInvitation(tx, actor, invitationId)),
  };
}
