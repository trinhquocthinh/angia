import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { PurgeRepository } from '../application/ports.js';

// Role app NOBYPASSRLS: hồ sơ gia đình khác không đọc được, lọc family_id thêm để phòng thủ theo chiều sâu.
export function createPurgeRepository(pool: pg.Pool): PurgeRepository {
  return {
    profileExists: (familyId, profileId) =>
      withFamilyScope(pool, familyId, async (client) => {
        const result = await client.query('SELECT 1 FROM health_profiles WHERE id = $1 AND family_id = $2', [
          profileId,
          familyId,
        ]);
        return (result.rowCount ?? 0) > 0;
      }),
  };
}
