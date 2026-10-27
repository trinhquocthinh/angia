import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ExtractionRepository } from '../application/ports.js';
import { createExtractionStore } from './createExtractionStore.js';
import { withPinnedFamilyScope } from './withPinnedFamilyScope.js';

// Một session giữ khóa operation trong lúc HTTP, nhưng mỗi lần chạm dữ liệu vẫn là transaction RLS ngắn.
// Không giữ thêm connection của pool khi nhiều worker cùng hoạt động.
export function createExtractionRepository(
  pool: pg.Pool,
  now: () => Date = () => new Date(),
): ExtractionRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createExtractionStore(client, familyId, now))),
    runExclusive: async (familyId, documentId, work) => {
      const client = await pool.connect();
      const key = `angia:ocr:${familyId}:${documentId}`;
      let held = false;
      let connectionError: Error | undefined;
      try {
        held = (
          await client.query<{ held: boolean }>(
            'SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS held',
            [key],
          )
        ).rows[0]!.held;
        if (!held) return null;
        return await work({
          withFamily: (scope, action) =>
            withPinnedFamilyScope(client, scope, (scoped) =>
              action(createExtractionStore(scoped, scope, now)),
            ),
        });
      } finally {
        if (held) {
          try {
            await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', [key]);
          } catch (error) {
            connectionError = error instanceof Error ? error : new Error('Mất khóa operation');
          }
        }
        client.release(connectionError);
      }
    },
  };
}
