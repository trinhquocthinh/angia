import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ExportSession } from '../application/ports.js';
import { readExportAccount } from './readExportAccount.js';
import { streamProfileJson } from './streamProfileJson.js';
import { streamExportRows } from './streamExportRows.js';

export function createExportSession(
  client: pg.PoolClient,
  exportId: string,
  request: ExportSession['request'],
): ExportSession {
  return {
    request,
    getAccount: () => readExportAccount(client, request.accountId),
    getProfile: (familyId, profileId, accountId) =>
      withFamilyScope(client, familyId, async (db) => {
        const { rows } = await db.query(
          `SELECT p.id, p.family_id, EXISTS(SELECT 1 FROM accounts a
          WHERE a.health_profile_id = p.id AND a.id <> $3) AS linked_to_other
          FROM health_profiles p WHERE p.id = $1 AND p.family_id = $2`,
          [profileId, familyId, accountId],
        );
        const row = rows[0];
        return row
          ? {
              id: row.id as string,
              familyId: row.family_id as string,
              linkedToOther: row.linked_to_other as boolean,
            }
          : null;
      }),
    profileChunks: (familyId, profileId) => streamProfileJson(client, familyId, profileId),
    images: async function* (familyId, profileId) {
      const sql = `SELECT id,image_key FROM source_documents WHERE health_profile_id = $1 AND family_id = $2
        AND image_key IS NOT NULL AND image_sha256 IS NOT NULL AND status <> 'uploaded'`;
      for await (const row of streamExportRows(client, familyId, profileId, sql)) {
        yield { id: row.id as string, key: row.image_key as string };
      }
    },
    markReady: async (key) => {
      await client.query(
        `UPDATE data_exports SET status='ready',object_key=$2,expires_at=now()+interval '24 hours'
        WHERE id=$1 AND status='pending'`,
        [exportId, key],
      );
    },
    markFailed: async () => {
      await client.query(`UPDATE data_exports SET status='failed' WHERE id=$1 AND status='pending'`, [
        exportId,
      ]);
    },
  };
}
