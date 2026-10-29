import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ObjectPurgeRepository } from '../application/ports.js';

export function createObjectPurgeRepository(pool: pg.Pool): ObjectPurgeRepository {
  return {
    listFamilies: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) =>
        work({
          next: async (limit, maxAttempts, afterKey) =>
            (
              await client.query<{ object_key: string }>(
                `SELECT object_key FROM object_purges
           WHERE family_id=$1 AND attempts<$2 AND ($4::text IS NULL OR object_key>$4)
           ORDER BY object_key LIMIT $3 FOR UPDATE SKIP LOCKED`,
                [familyId, maxAttempts, limit, afterKey ?? null],
              )
            ).rows.map((row) => row.object_key),
          remove: async (key) => {
            await client.query('DELETE FROM object_purges WHERE family_id=$1 AND object_key=$2', [
              familyId,
              key,
            ]);
          },
          recordFailure: async (key, error) => {
            await client.query(
              `UPDATE object_purges SET attempts=attempts+1,last_error=$3
           WHERE family_id=$1 AND object_key=$2 AND attempts<10`,
              [familyId, key, error],
            );
          },
        }),
      ),
  };
}
