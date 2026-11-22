import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ExportProfileScope } from '../domain/resolveExportScope.js';

export async function readExportProfile(
  client: pg.PoolClient,
  familyId: string,
  profileId: string,
  accountId: string,
): Promise<ExportProfileScope | null> {
  return withFamilyScope(client, familyId, async (db) => {
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
  });
}
