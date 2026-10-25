import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

export async function revokePushAccounts(
  client: pg.PoolClient,
  accountIds: string[],
  snapshotAt: Date,
): Promise<void> {
  if (!accountIds.length) return;
  const { rows } = await client.query<{ id: string; family_id: string | null }>(
    'SELECT id,family_id FROM accounts WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',
    [accountIds],
  );
  for (const row of rows) {
    if (!row.family_id) continue;
    await withFamilyScope(client, row.family_id, async (scoped) => {
      await scoped.query('DELETE FROM push_subscriptions WHERE account_id=$1 AND authorized_at<$2', [
        row.id,
        snapshotAt,
      ]);
    });
  }
}
