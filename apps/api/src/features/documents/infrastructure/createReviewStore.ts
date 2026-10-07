import { and, desc, eq, type SQL } from 'drizzle-orm';
import {
  toMeasurement,
  toMeasurementRow,
} from '@src/features/measurements/infrastructure/measurementRows.js';
import { extractions, measurements, sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ReviewStore } from '../application/reviewPorts.js';

// Chạy trong transaction đã SET LOCAL app.family_id; bộ lọc family_id bổ sung phòng thủ theo chiều sâu.
export function createReviewStore(tx: FamilyScopedTx, familyId: string): ReviewStore {
  const owned = (id: string) => and(eq(sourceDocuments.id, id), eq(sourceDocuments.familyId, familyId));
  return {
    listDocuments: async ({ status, profileId }) => {
      const conditions: SQL[] = [eq(sourceDocuments.familyId, familyId)];
      if (status) conditions.push(eq(sourceDocuments.status, status));
      if (profileId) conditions.push(eq(sourceDocuments.healthProfileId, profileId));
      return tx
        .select()
        .from(sourceDocuments)
        .where(and(...conditions))
        .orderBy(desc(sourceDocuments.createdAt), desc(sourceDocuments.id));
    },
    findDocument: async (id, options) => {
      const query = tx.select().from(sourceDocuments).where(owned(id));
      return (await (options?.lock ? query.for('update') : query))[0] ?? null;
    },
    findLatestExtraction: async (documentId) =>
      (
        await tx
          .select({ payload: extractions.payload })
          .from(extractions)
          .where(and(eq(extractions.sourceDocumentId, documentId), eq(extractions.familyId, familyId)))
          .orderBy(desc(extractions.createdAt), desc(extractions.id))
          .limit(1)
      )[0]?.payload ?? null,
    insertMeasurement: async (input) => {
      const [row] = await tx.insert(measurements).values(toMeasurementRow(input, familyId)).returning();
      if (!row) throw new Error('Không tạo được số đo');
      return toMeasurement(row);
    },
    markApproved: async (id, documentDate) => {
      const [row] = await tx
        .update(sourceDocuments)
        .set({ status: 'approved', documentDate })
        .where(and(owned(id), eq(sourceDocuments.status, 'pending_review')))
        .returning();
      if (!row) throw new Error('Chứng từ không còn ở trạng thái chờ duyệt');
      return row;
    },
  };
}
