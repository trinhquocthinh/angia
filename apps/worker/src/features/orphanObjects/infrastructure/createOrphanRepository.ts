import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { OrphanRepository } from '../application/ports.js';

// Pool role app NOBYPASSRLS: families không áp RLS nên liệt kê được; khóa chứng từ chỉ đọc trong withFamilyScope.
export function createOrphanRepository(pool: pg.Pool): OrphanRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    referencedKeys: (familyId) =>
      withFamilyScope(pool, familyId, async (client) => {
        const result = await client.query<{ image_key: string }>(
          `SELECT image_key FROM source_documents WHERE family_id = $1 AND image_key IS NOT NULL`,
          [familyId],
        );
        return new Set(result.rows.map((row) => row.image_key));
      }),
  };
}
