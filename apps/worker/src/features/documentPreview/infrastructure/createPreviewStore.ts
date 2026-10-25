import type pg from 'pg';
import type { PreviewStore, PreviewDocument } from '../application/ports.js';

export function createPreviewStore(client: pg.PoolClient, familyId: string): PreviewStore {
  return {
    findDocument: async (id) =>
      (
        await client.query<PreviewDocument>(
          `SELECT id, health_profile_id AS "healthProfileId", status, original_key AS "originalKey", preview_key AS "previewKey", mime_type AS "mimeType"
       FROM source_documents WHERE id=$1 AND family_id=$2`,
          [id, familyId],
        )
      ).rows[0] ?? null,
    savePreview: async (id, key) =>
      (
        await client.query(
          `UPDATE source_documents SET preview_key=$1,status='awaiting_privacy' WHERE id=$2 AND family_id=$3 AND status='uploaded'`,
          [key, id, familyId],
        )
      ).rowCount === 1,
    markManualEntry: async (id) =>
      (
        await client.query(
          `UPDATE source_documents SET status='manual_entry' WHERE id=$1 AND family_id=$2 AND status='uploaded'`,
          [id, familyId],
        )
      ).rowCount === 1,
  };
}
