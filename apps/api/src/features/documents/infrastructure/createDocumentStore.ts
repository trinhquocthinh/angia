import { and, eq } from 'drizzle-orm';
import { healthProfiles, sourceDocuments, uploadBatches } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DocumentStore } from '../application/ports.js';
import { lockFamilyQuota } from '@src/features/familyQuota/infrastructure/lockFamilyQuota.js';
import { readFamilyUsage } from '@src/features/familyQuota/infrastructure/readFamilyUsage.js';
import type { PreviewQueue } from './createPreviewQueue.js';

// Chạy trong transaction đã SET LOCAL app.family_id; bộ lọc family_id bổ sung phòng thủ theo chiều sâu.
export function createDocumentStore(
  tx: FamilyScopedTx,
  familyId: string,
  queue: PreviewQueue,
): DocumentStore {
  return {
    readQuotaUsage: async (dayStart, lock) => {
      if (lock) await lockFamilyQuota(tx, familyId);
      return readFamilyUsage(tx, familyId, dayStart);
    },
    findProfile: async (id) =>
      (
        await tx
          .select({ consentStatus: healthProfiles.consentStatus })
          .from(healthProfiles)
          .where(and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId)))
          .for('share')
      )[0] ?? null,
    insertBatch: async (batch) => {
      await tx.insert(uploadBatches).values({ ...batch, familyId });
    },
    insertDocument: async (input) => {
      const [document] = await tx
        .insert(sourceDocuments)
        .values({ ...input, familyId, status: 'uploaded' })
        .returning();
      if (!document) throw new Error('Không tạo được chứng từ');
      return document;
    },
    enqueuePreview: (documentId) => queue(tx, { documentId, familyId }),
  };
}
