import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { objectPurges } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DeletionRepository, DeletionStore } from '../application/deletionPorts.js';
import { deleteDocumentWithRevisits } from './deleteDocumentWithRevisits.js';
import { countDeletionImpact } from './countDeletionImpact.js';
import { findDocumentWithConsent } from './findDocumentWithConsent.js';

export function createDeletionRepository(db: Database): DeletionRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findDocument: async (id, lock) => {
            const row = await findDocumentWithConsent(tx, familyId, id, lock);
            return row && { imageKey: row.imageKey, profileConsentStatus: row.profileConsentStatus };
          },
          deleteDocument: (id) => deleteDocumentWithRevisits(tx, familyId, id),
          insertObjectPurge: async (objectKey) => {
            await tx.insert(objectPurges).values({ objectKey, familyId }).onConflictDoNothing();
          },
          removeObjectPurge: async (objectKey) => {
            await tx.delete(objectPurges).where(eq(objectPurges.objectKey, objectKey));
          },
          countImpact: (id) => countDeletionImpact(tx, id),
        } satisfies DeletionStore),
      ),
  };
}
