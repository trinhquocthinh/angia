import type pg from 'pg';
import type { PrivacyStore, PrivacyDocument } from '../application/ports.js';
// Mọi truy vấn dùng transaction withFamilyScope; CAS chỉ tác động draft hiện hành chưa có kết quả.
export function createPrivacyStore(client: pg.PoolClient, familyId: string): PrivacyStore {
  return {
    findDocument: async (id) =>
      (
        await client.query<PrivacyDocument>(
          `SELECT id,health_profile_id AS "healthProfileId",status,original_key AS "originalKey",mime_type AS "mimeType",
       privacy_draft_id AS "privacyDraftId",privacy_draft_status AS "privacyDraftStatus",ocr_image_key AS "ocrImageKey"
       FROM source_documents WHERE id=$1 AND family_id=$2`,
          [id, familyId],
        )
      ).rows[0] ?? null,
    saveReady: async (id, draftId, key, sha256) =>
      (
        await client.query(
          `UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2
       WHERE id=$3 AND family_id=$4 AND status='awaiting_privacy' AND privacy_draft_id=$5 AND privacy_draft_status='pending'`,
          [key, sha256, id, familyId, draftId],
        )
      ).rowCount === 1,
    markFailed: async (id, draftId) =>
      (
        await client.query(
          `UPDATE source_documents SET privacy_draft_status='failed'
       WHERE id=$1 AND family_id=$2 AND status='awaiting_privacy' AND privacy_draft_id=$3 AND privacy_draft_status='pending'`,
          [id, familyId, draftId],
        )
      ).rowCount === 1,
  };
}
