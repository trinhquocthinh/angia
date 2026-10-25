import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

export async function deleteSessionAndPushDevice(
  db: Database,
  sessionId: string,
  deviceId?: string | null,
): Promise<void> {
  await db.transaction(async (tx) => {
    const result = await tx.execute(sql`SELECT account_id FROM sessions WHERE id=${sessionId}`);
    const accountId = result.rows[0]?.account_id;
    if (!accountId) return;
    const accounts = await tx.execute(sql`SELECT family_id FROM accounts WHERE id=${accountId} FOR UPDATE`);
    const familyId = accounts.rows[0]?.family_id;
    if (familyId)
      await withFamilyScope(tx, String(familyId), async (scoped) => {
        const target = deviceId ? sql`id=${deviceId}::uuid` : sql`last_session_id=${sessionId}`;
        await scoped.execute(sql`DELETE FROM push_subscriptions WHERE account_id=${accountId} AND ${target}`);
      });
    await tx.execute(sql`DELETE FROM sessions WHERE id=${sessionId} AND account_id=${accountId}`);
  });
}
