import { EXTRACT_DOCUMENT_QUEUE } from '@angia/contracts';
import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import type { SanitizeStore, SanitizeDocument } from '../application/ports.js';

export function createSanitizeStore(client: pg.PoolClient, familyId: string, boss: PgBoss): SanitizeStore {
  const recordPurge = async (key: string): Promise<void> => {
    await client.query(
      `INSERT INTO object_purges (object_key,family_id) VALUES ($1,$2) ON CONFLICT (object_key) DO NOTHING`,
      [key, familyId],
    );
  };
  return {
    findDocument: async (id) =>
      (
        await client.query<SanitizeDocument>(
          `SELECT id,health_profile_id AS "healthProfileId",status,image_key AS "imageKey",privacy_approved_by AS "privacyApprovedBy"
       FROM source_documents WHERE id=$1 AND family_id=$2`,
          [id, familyId],
        )
      ).rows[0] ?? null,
    saveSanitized: async (id, change) => {
      const { rows } = await client.query<{ status: 'extracting' | 'manual_entry' }>(
        `UPDATE source_documents SET image_key=$1,image_sha256=$2,size_bytes=$3,
          status=CASE WHEN privacy_approved_by IS NOT NULL THEN 'extracting' ELSE 'manual_entry' END
         WHERE id=$4 AND family_id=$5 AND status='uploaded' AND image_key=$6
         RETURNING status`,
        [change.key, change.sha256, change.sizeBytes, id, familyId, change.oldKey],
      );
      const status = rows[0]?.status;
      if (!status) return null;
      await recordPurge(change.oldKey);
      if (status === 'extracting') {
        const db = { executeSql: (text: string, values?: unknown[]) => client.query(text, values) };
        if (!(await boss.send(EXTRACT_DOCUMENT_QUEUE, { documentId: id, familyId }, { db })))
          throw new Error('extract_enqueue_failed');
      }
      return status;
    },
    markUnusable: async (id, oldKey) => {
      const result = await client.query(
        `UPDATE source_documents SET image_key=NULL,image_sha256=NULL,status='manual_entry'
         WHERE id=$1 AND family_id=$2 AND status='uploaded' AND image_key=$3`,
        [id, familyId, oldKey],
      );
      if (result.rowCount !== 1) return false;
      await recordPurge(oldKey);
      return true;
    },
    recordPurge,
  };
}
