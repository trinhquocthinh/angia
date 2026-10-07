import type { ProfileRepository } from '../application/ports.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { createProfileStore } from './createProfileStore.js';

export function createProfileRepository(db: Database): ProfileRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createProfileStore(tx, familyId))),
  };
}
