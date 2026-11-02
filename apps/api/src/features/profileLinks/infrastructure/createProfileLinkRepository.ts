import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ProfileLinkRepository } from '../application/ports.js';
import { createProfileLinkStore } from './createProfileLinkStore.js';

export function createProfileLinkRepository(db: Database): ProfileLinkRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createProfileLinkStore(tx, familyId))),
  };
}
