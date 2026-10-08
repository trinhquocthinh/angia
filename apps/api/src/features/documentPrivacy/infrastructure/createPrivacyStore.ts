import { and, eq } from 'drizzle-orm';
import { healthProfiles, sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PrivacyStore } from '../application/ports.js';
import type { PrivacyQueue } from './createPrivacyQueue.js';
export function createPrivacyStore(tx: FamilyScopedTx, familyId: string, queue: PrivacyQueue): PrivacyStore {
  const owned = (id: string) => and(eq(sourceDocuments.id, id), eq(sourceDocuments.familyId, familyId));
  return {
    findDocument: async (id, lock) => {
      const query = tx.select().from(sourceDocuments).where(owned(id));
      return (await (lock ? query.for('update') : query))[0] ?? null;
    },
    consentConfirmed: async (profileId) => {
      const rows = await tx
        .select({ consent: healthProfiles.consentStatus })
        .from(healthProfiles)
        .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)))
        .for('share');
      return rows[0]?.consent === 'confirmed';
    },
    updateDocument: async (id, update) => {
      const [row] = await tx.update(sourceDocuments).set(update).where(owned(id)).returning();
      if (!row) throw new Error('Chứng từ không còn tồn tại');
      return row;
    },
    enqueuePreparation: (documentId, draftId, edits) =>
      queue.prepare(tx, { documentId, familyId, draftId, edits }),
    enqueueExtraction: (documentId) => queue.extract(tx, { documentId, familyId }),
  };
}
