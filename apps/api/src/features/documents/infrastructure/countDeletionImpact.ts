import type { DocumentDeletionImpact } from '@angia/contracts';
import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Đợt thuốc gồm mọi đợt trỏ tới dòng thuốc của đơn thuộc chứng từ (kể cả đợt "Dùng lại đơn").
export async function countDeletionImpact(
  tx: FamilyScopedTx,
  documentId: string,
): Promise<DocumentDeletionImpact> {
  const result = await tx.execute<Record<keyof DocumentDeletionImpact, number>>(sql`
    WITH p AS (SELECT id FROM prescriptions WHERE source_document_id = ${documentId}),
         i AS (SELECT id FROM prescription_items WHERE prescription_id IN (SELECT id FROM p)),
         c AS (SELECT status FROM medication_courses WHERE prescription_item_id IN (SELECT id FROM i))
    SELECT (SELECT count(*) FROM p)::int AS "prescriptions",
           (SELECT count(*) FROM i)::int AS "prescriptionItems",
           (SELECT count(*) FROM lab_results WHERE source_document_id = ${documentId})::int AS "labResults",
           (SELECT count(*) FROM measurements WHERE source_document_id = ${documentId})::int AS "measurements",
           (SELECT count(*) FROM c)::int AS "medicationCourses",
           (SELECT count(*) FROM c WHERE status = 'active')::int AS "activeMedicationCourses"`);
  return result.rows[0]!;
}
