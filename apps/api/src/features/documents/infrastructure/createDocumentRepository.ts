import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DocumentRepository } from '../application/ports.js';
import { createDocumentStore } from './createDocumentStore.js';
import type { ExtractionQueue } from './createExtractionQueue.js';

export function createDocumentRepository(db: Database, queue: ExtractionQueue): DocumentRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createDocumentStore(tx, familyId, queue))),
  };
}
