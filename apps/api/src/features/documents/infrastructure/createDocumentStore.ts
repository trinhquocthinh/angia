import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import { sql } from 'drizzle-orm';
import { sourceDocuments, uploadBatches } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DocumentStore } from '../application/ports.js';
import { lockFamilyQuota } from '@src/features/familyQuota/infrastructure/lockFamilyQuota.js';
import { readFamilyUsage } from '@src/features/familyQuota/infrastructure/readFamilyUsage.js';
import type { SanitizeQueue } from './createSanitizeQueue.js';

// Chạy trong transaction đã SET LOCAL app.family_id; bộ lọc family_id bổ sung phòng thủ theo chiều sâu.
export function createDocumentStore(
  tx: FamilyScopedTx,
  familyId: string,
  queue: SanitizeQueue,
): DocumentStore {
  return {
    readQuotaUsage: async (dayStart, lock) => {
      if (lock) await lockFamilyQuota(tx, familyId);
      return readFamilyUsage(tx, familyId, dayStart);
    },
    findProfile: (id) => findProfileInFamily(tx, familyId, id, 'share'),
    insertBatch: async (batch) => {
      await tx.insert(uploadBatches).values({ ...batch, familyId });
    },
    insertDocument: async (input) => {
      const [document] = await tx
        .insert(sourceDocuments)
        .values({
          ...input,
          familyId,
          status: 'uploaded',
          privacyApprovedAt: input.privacyApprovedBy === null ? null : sql`now()`,
        })
        .returning();
      if (!document) throw new Error('Không tạo được chứng từ');
      return document;
    },
    enqueueSanitize: (documentId) => queue(tx, { documentId, familyId }),
  };
}
