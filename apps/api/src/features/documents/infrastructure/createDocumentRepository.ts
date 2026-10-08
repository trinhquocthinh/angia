import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DocumentRepository } from '../application/ports.js';
import { createDocumentStore } from './createDocumentStore.js';
import type { PreviewQueue } from './createPreviewQueue.js';

export function createDocumentRepository(db: Database, queue: PreviewQueue): DocumentRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => work(createDocumentStore(tx, familyId, queue))),
  };
}
