import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ReviewRepository } from '../application/reviewPorts.js';
import { createReviewStore } from './createReviewStore.js';

export function createReviewRepository(db: Database): ReviewRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createReviewStore(tx, familyId))),
  };
}
