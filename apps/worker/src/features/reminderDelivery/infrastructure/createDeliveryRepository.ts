import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DeliveryRepository, FanOutStore, UnsentReminder } from '../application/ports.js';
import { processNextDelivery } from './processNextDelivery.js';
import { queryFamilyAccounts } from './queryFamilyAccounts.js';

async function insertPending(
  client: pg.PoolClient,
  familyId: string,
  reminderId: string,
  deviceIds: string[],
  now: Date,
  newId: () => string,
): Promise<void> {
  if (deviceIds.length === 0) return;
  const values: unknown[] = [familyId, reminderId, now];
  const tuples = deviceIds.map((deviceId) => {
    values.push(newId(), deviceId);
    const at = values.length;
    return `($${at - 1}, $1, $2, $${at}, 'pending', 0, $3, $3, $3)`;
  });
  await client.query(
    `INSERT INTO reminder_deliveries
       (id, family_id, reminder_id, push_subscription_id, status, attempts, next_attempt_at, created_at, updated_at)
     VALUES ${tuples.join(', ')}
     ON CONFLICT (reminder_id, push_subscription_id) DO NOTHING`,
    values,
  );
}

function createFanOutStore(client: pg.PoolClient, familyId: string, newId: () => string): FanOutStore {
  return {
    listUnsentDue: async (now) =>
      (
        await client.query<UnsentReminder>(
          `SELECT r.id AS "reminderId", r.health_profile_id AS "profileId", r.scheduled_at AS "scheduledAt",
                  COALESCE(p.consent_status = 'confirmed', false) AS "consentConfirmed"
             FROM reminders r
             LEFT JOIN health_profiles p ON p.id = r.health_profile_id AND p.family_id = r.family_id
            WHERE r.family_id = $1 AND r.sent_at IS NULL AND r.scheduled_at <= $2
            ORDER BY r.scheduled_at, r.id
            FOR UPDATE OF r SKIP LOCKED`,
          [familyId, now],
        )
      ).rows,
    listFamilyAccounts: () => queryFamilyAccounts(client, familyId),
    listAssignments: async () =>
      (
        await client.query<{ profileId: string; accountId: string }>(
          `SELECT health_profile_id AS "profileId", account_id AS "accountId"
             FROM reminder_recipients WHERE family_id = $1`,
          [familyId],
        )
      ).rows,
    listDeviceIds: async (accountIds) => {
      if (accountIds.length === 0) return [];
      const { rows } = await client.query<{ id: string }>(
        `SELECT id FROM push_subscriptions WHERE family_id = $1 AND account_id = ANY($2::uuid[]) ORDER BY id`,
        [familyId, accountIds],
      );
      return rows.map((row) => row.id);
    },
    markFannedOut: async (reminderId, deviceIds, now) => {
      await insertPending(client, familyId, reminderId, deviceIds, now, newId);
      await client.query('UPDATE reminders SET sent_at = $3 WHERE id = $1 AND family_id = $2', [
        reminderId,
        familyId,
        now,
      ]);
    },
  };
}

// Pool role app NOBYPASSRLS: families không áp RLS nên liệt kê được; ledger/lời nhắc/thiết bị chỉ
// đọc/ghi trong withFamilyScope (Tech Spec §3). Fan-out một transaction / gia đình; gửi một transaction / đích.
export function createDeliveryRepository(pool: pg.Pool, newId: () => string): DeliveryRepository {
  return {
    listFamilyIds: async () =>
      (await pool.query<{ id: string }>('SELECT id FROM families ORDER BY id')).rows.map((row) => row.id),
    withFanOut: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createFanOutStore(client, familyId, newId))),
    processNextDelivery: (familyId, now, decide) => processNextDelivery(pool, familyId, now, decide),
  };
}
