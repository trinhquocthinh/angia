import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { newId } from '@src/shared/db/schema/newId.js';
import type { PushActor, PushIntent } from '../application/ports.js';
import type { PushSubscriptionValue } from '@angia/web-push';
import { lockPushAccount } from './lockPushAccount.js';

export async function savePushDevice(
  tx: FamilyScopedTx,
  a: PushActor,
  value: PushSubscriptionValue,
  now: Date,
  intent: PushIntent,
) {
  if (!(await lockPushAccount(tx, a))) return 'expired' as const;
  const sessions =
    await tx.execute(sql`SELECT created_at::text AS created_at FROM sessions WHERE id=${a.sessionId}
    AND account_id=${a.accountId} AND expires_at>${now.toISOString()}::timestamptz FOR KEY SHARE`);
  const session = sessions.rows[0];
  if (!session) return 'expired' as const;
  const hash = createHash('sha256').update(value.endpoint).digest('hex');
  const existing = await tx.execute(sql`SELECT id,account_id,endpoint_hash FROM push_subscriptions
    WHERE endpoint_hash=${hash} OR id=${a.deviceId ?? null}::uuid`);
  const endpoint = existing.rows.find((r) => r.endpoint_hash === hash);
  if (endpoint && endpoint.account_id !== a.accountId) return 'conflict' as const;
  const device = endpoint ?? existing.rows.find((r) => r.account_id === a.accountId);
  if (!device && intent === 'sync') return 'missing' as const;
  const id = device ? String(device.id) : newId();
  const count = await tx.execute(sql`SELECT count(*)::int AS n FROM push_subscriptions
    WHERE account_id=${a.accountId} AND id<>${id}`);
  if (Number(count.rows[0]?.n) >= 10) return 'quota' as const;
  // authorized_at lấy từ lần OIDC tạo phiên, không lấy thời điểm sync để né snapshot IdP.
  const authorizedAt = String(session.created_at);
  await tx.execute(sql`INSERT INTO push_subscriptions
    (id,family_id,account_id,last_session_id,authorized_at,endpoint,endpoint_hash,p256dh,auth,updated_at)
    VALUES(${id},${a.familyId},${a.accountId},${a.sessionId},${authorizedAt}::timestamptz,
      ${value.endpoint},${hash},${value.keys.p256dh},${value.keys.auth},${now.toISOString()}::timestamptz)
    ON CONFLICT(id) DO UPDATE SET last_session_id=excluded.last_session_id,
      authorized_at=excluded.authorized_at, endpoint=excluded.endpoint, endpoint_hash=excluded.endpoint_hash,
      p256dh=excluded.p256dh,auth=excluded.auth,updated_at=excluded.updated_at`);
  return { deviceId: id };
}
