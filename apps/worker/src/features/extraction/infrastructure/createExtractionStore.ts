import type pg from 'pg';
import { v7 as newId } from 'uuid';
import type { ExtractionStore } from '../application/ports.js';
import type { DocumentToExtract } from '../domain/ExtractionDocument.js';

// Chạy trong transaction đã SET LOCAL app.family_id; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
// Chuyển trạng thái chỉ áp dụng từ `extracting` (FSM BR §3.1) để job trùng không ghi đè kết quả.
export function createExtractionStore(client: pg.PoolClient, familyId: string): ExtractionStore {
  const transition = async (id: string, status: string, from: string[]) => {
    await client.query(
      `UPDATE source_documents SET status = $1 WHERE id = $2 AND family_id = $3 AND status = ANY($4::text[])`,
      [status, id, familyId, from],
    );
  };
  return {
    findDocument: async (id) =>
      (
        await client.query<DocumentToExtract>(
          `SELECT id, status, type AS "declaredType", original_key AS "originalKey", mime_type AS "mimeType", preview_key AS "previewKey",
           ocr_image_key AS "ocrImageKey", ocr_image_sha256 AS "ocrImageSha256",
           privacy_approved_by AS "privacyApprovedBy", privacy_approved_at AS "privacyApprovedAt"
           FROM source_documents WHERE id = $1 AND family_id = $2 FOR UPDATE`,
          [id, familyId],
        )
      ).rows[0] ?? null,
    markExtracting: (id) => transition(id, 'extracting', ['extracting']),
    markManualEntry: (id) => transition(id, 'manual_entry', ['uploaded', 'extracting']),
    savePendingReview: async (id, extraction) => {
      const updated = await client.query(
        `UPDATE source_documents SET status = 'pending_review', type = $1
         WHERE id = $2 AND family_id = $3 AND status = 'extracting'`,
        [extraction.type, id, familyId],
      );
      if (updated.rowCount !== 1) return;
      await client.query(
        `INSERT INTO extractions (id, family_id, source_document_id, provider, model, payload, cost_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          newId(),
          familyId,
          id,
          extraction.provider,
          extraction.model,
          extraction.payload,
          extraction.costUsd,
        ],
      );
    },
  };
}
