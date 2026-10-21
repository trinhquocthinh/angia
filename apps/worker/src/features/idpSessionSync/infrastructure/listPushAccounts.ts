import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

export async function listPushAccounts(pool: pg.Pool, families: string[]): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const familyId of new Set(families)) {
    await withFamilyScope(pool, familyId, async (client) => {
      const { rows } = await client.query<{ account_id: string }>(
        'SELECT DISTINCT account_id FROM push_subscriptions',
      );
      for (const row of rows) ids.add(row.account_id);
    });
  }
  return ids;
}
