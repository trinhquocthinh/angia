import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope, type FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { PushActor, PushSubscriptionRepository } from '../application/ports.js';
import { newId } from '@src/shared/db/schema/newId.js';

async function lockAccount(tx: FamilyScopedTx, actor: PushActor) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`angia:push:${actor.accountId}`}, 0))`,
  );
}
async function activeSession(tx: FamilyScopedTx, a: PushActor, now: Date) {
  const rows = await tx.execute(sql`SELECT s.id FROM sessions s JOIN accounts a ON a.id=s.account_id
    WHERE s.id=${a.sessionId} AND s.account_id=${a.accountId} AND a.family_id=${a.familyId}
    AND s.expires_at>${now.toISOString()}::timestamptz FOR KEY SHARE OF s, a`);
  return rows.rows.length > 0;
}
export function createPushSubscriptionRepository(db: Database): PushSubscriptionRepository {
  return {
    async save(a, value, now) {
      try {
        return await withFamilyScope(db, a.familyId, async (tx) => {
          await lockAccount(tx, a);
          if (!(await activeSession(tx, a, now))) return 'expired';
          await tx.execute(sql`DELETE FROM push_subscriptions p WHERE p.account_id=${a.accountId}
            AND NOT EXISTS(SELECT 1 FROM sessions s WHERE s.id=p.session_id AND s.expires_at>${now.toISOString()}::timestamptz)`);
          const hash = createHash('sha256').update(value.endpoint).digest('hex');
          const existing = await tx.execute(
            sql`SELECT session_id,account_id FROM push_subscriptions WHERE endpoint_hash=${hash}`,
          );
          if (existing.rows.some((row) => row.account_id !== a.accountId)) return 'conflict';
          const count =
            await tx.execute(sql`SELECT count(*)::int AS n FROM push_subscriptions WHERE account_id=${a.accountId}
            AND session_id<>${a.sessionId} AND endpoint_hash<>${hash}`);
          if (Number(count.rows[0]?.n) >= 10) return 'quota';
          await tx.execute(sql`DELETE FROM push_subscriptions WHERE account_id=${a.accountId}
            AND (session_id=${a.sessionId} OR endpoint_hash=${hash})`);
          await tx.execute(sql`INSERT INTO push_subscriptions(id,family_id,account_id,session_id,endpoint,endpoint_hash,p256dh,auth)
            VALUES(${newId()},${a.familyId},${a.accountId},${a.sessionId},${value.endpoint},${hash},${value.keys.p256dh},${value.keys.auth})`);
          return 'saved';
        });
      } catch (error) {
        // Không ghi exception DB vì DETAIL có thể chứa endpoint/khóa.
        if (
          (error as { cause?: { code?: string }; code?: string }).code === '23505' ||
          (error as { cause?: { code?: string } }).cause?.code === '23505'
        )
          return 'conflict';
        throw new Error('Không lưu được đăng ký thông báo.');
      }
    },
    read(a, now) {
      return withFamilyScope(db, a.familyId, async (tx) => {
        const result = await tx.execute(sql`SELECT p.endpoint,p.p256dh,p.auth FROM push_subscriptions p
          JOIN sessions s ON s.id=p.session_id JOIN accounts a ON a.id=p.account_id
          WHERE p.account_id=${a.accountId} AND p.session_id=${a.sessionId} AND a.family_id=${a.familyId}
          AND s.expires_at>${now.toISOString()}::timestamptz LIMIT 1`);
        const row = result.rows[0];
        return row
          ? { endpoint: String(row.endpoint), keys: { p256dh: String(row.p256dh), auth: String(row.auth) } }
          : null;
      });
    },
    async remove(a, endpoint) {
      await withFamilyScope(db, a.familyId, async (tx) => {
        await lockAccount(tx, a);
        await tx.execute(sql`DELETE FROM push_subscriptions WHERE account_id=${a.accountId} AND session_id=${a.sessionId}
          ${endpoint ? sql`AND endpoint=${endpoint}` : sql``}`);
      });
    },
  };
}
