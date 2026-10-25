import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { PrivacyRepository } from '../application/ports.js';
import type { PrivacyQueue } from './createPrivacyQueue.js';
import { createPrivacyStore } from './createPrivacyStore.js';
export function createPrivacyRepository(db: Database, queue: PrivacyQueue): PrivacyRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createPrivacyStore(tx, familyId, queue))),
  };
}
