import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { InvitationRepository } from '../application/ports.js';
import { createInvitationStore } from './createInvitationStore.js';

export function createInvitationRepository(db: Database): InvitationRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createInvitationStore(tx, familyId))),
  };
}
