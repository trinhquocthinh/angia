import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { PushSubscriptionRepository } from '../application/ports.js';
import { lockPushAccount } from './lockPushAccount.js';
import { savePushDevice } from './savePushDevice.js';

export function createPushSubscriptionRepository(db: Database): PushSubscriptionRepository {
  return {
    async save(a, value, now, intent = 'enable') {
      try {
        return await withFamilyScope(db, a.familyId, (tx) => savePushDevice(tx, a, value, now, intent));
      } catch (error) {
        const value = error as { code?: string; cause?: { code?: string } };
        if (value.code === '23505' || value.cause?.code === '23505') return 'conflict';
        throw new Error('Không lưu được đăng ký thông báo.');
      }
    },
    read(a) {
      if (!a.deviceId) return Promise.resolve(null);
      return withFamilyScope(db, a.familyId, async (tx) => {
        const result = await tx.execute(sql`SELECT p.endpoint,p.p256dh,p.auth FROM push_subscriptions p
          JOIN accounts a ON a.id=p.account_id AND a.family_id=p.family_id
          WHERE p.id=${a.deviceId} AND p.account_id=${a.accountId} AND p.family_id=${a.familyId} LIMIT 1`);
        const row = result.rows[0];
        return row
          ? { endpoint: String(row.endpoint), keys: { p256dh: String(row.p256dh), auth: String(row.auth) } }
          : null;
      });
    },
    async remove(a, endpoint) {
      if (!a.deviceId) return;
      await withFamilyScope(db, a.familyId, async (tx) => {
        await lockPushAccount(tx, a);
        await tx.execute(sql`DELETE FROM push_subscriptions WHERE id=${a.deviceId}
          AND account_id=${a.accountId} ${endpoint ? sql`AND endpoint=${endpoint}` : sql``}`);
      });
    },
  };
}
