import type pg from 'pg';
import { readExportProfile } from './readExportProfile.js';
import type { ExportSession } from '../application/ports.js';
import { enterDataExportRole, leaveDataExportRole } from './enterDataExportRole.js';
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
    getProfile: (familyId, profileId, accountId) => readExportProfile(client, familyId, profileId, accountId),
    profileChunks: (familyId, profileId) => streamProfileJson(client, familyId, profileId),
    images: async function* (familyId, profileId) {
      const sql = `SELECT id,image_key FROM source_documents WHERE health_profile_id = $1 AND family_id = $2
        AND image_key IS NOT NULL AND image_sha256 IS NOT NULL AND status <> 'uploaded'`;
      for await (const row of streamExportRows(client, familyId, profileId, sql)) {
        yield { id: row.id as string, key: row.image_key as string };
      }
    },
    enterRemovedWindowScope: () => enterDataExportRole(client, request.accountId),
    removedProfiles: async () => {
      const { rows } = await client.query<{ family_id: string; health_profile_id: string }>(
        `SELECT family_id, health_profile_id FROM removed_member_windows
         WHERE health_profile_id IS NOT NULL ORDER BY removed_at, family_id`,
      );
      return rows.map((row) => ({ familyId: row.family_id, profileId: row.health_profile_id }));
    },
    leaveRemovedWindowScope: () => leaveDataExportRole(client),
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
