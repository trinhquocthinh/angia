import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

// Session đã lấy từ pool nhưng chưa có transaction; withFamilyScope(PoolClient) chỉ tạo SAVEPOINT.
export async function withPinnedFamilyScope<T>(
  client: pg.PoolClient,
  familyId: string,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  await client.query('BEGIN');
  try {
    const result = await withFamilyScope(client, familyId, work);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}
