import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DeliveryCandidate, ReminderKind } from '../application/ports.js';
import type { DeliveryUpdate } from '../domain/DeliveryTypes.js';
import { queryFamilyAccounts } from './queryFamilyAccounts.js';

interface LockedRow {
  kind: ReminderKind;
  deliveryId: string;
  reminderId: string;
  attempts: number;
  profileId: string;
  scheduledAt: Date;
  deviceId: string | null;
  accountId: string | null;
  endpoint: string | null;
  endpointHash: string | null;
  p256dh: string | null;
  auth: string | null;
}

// Khóa riêng dòng ledger (OF d): giữ khóa suốt lần gửi HTTP để worker khác SKIP LOCKED bỏ qua đích này.
async function lockNextDue(client: pg.PoolClient, familyId: string, now: Date): Promise<LockedRow | null> {
  const { rows } = await client.query<LockedRow>(
    `SELECT d.id AS "deliveryId", COALESCE(d.reminder_id, d.revisit_reminder_id) AS "reminderId", d.attempts,
            CASE WHEN d.revisit_reminder_id IS NULL THEN 'medication' ELSE 'revisit' END AS kind,
            COALESCE(r.health_profile_id, v.health_profile_id) AS "profileId",
            COALESCE(r.scheduled_at, v.scheduled_at) AS "scheduledAt",
            s.id AS "deviceId", s.account_id AS "accountId", s.endpoint, s.endpoint_hash AS "endpointHash",
            s.p256dh, s.auth
       FROM reminder_deliveries d
       LEFT JOIN reminders r ON r.id = d.reminder_id AND r.family_id = d.family_id
       LEFT JOIN revisit_reminders v ON v.id = d.revisit_reminder_id AND v.family_id = d.family_id
       LEFT JOIN push_subscriptions s ON s.id = d.push_subscription_id AND s.family_id = d.family_id
      WHERE d.family_id = $1 AND d.status = 'pending' AND d.next_attempt_at <= $2
      ORDER BY d.next_attempt_at, d.id
      LIMIT 1
      FOR UPDATE OF d SKIP LOCKED`,
    [familyId, now],
  );
  return rows[0] ?? null;
}

// Điều kiện người nhận đọc lại ngay lúc gửi (spec §4 revoked): đồng thuận, tài khoản, chỉ định hiện hành.
async function toCandidate(
  client: pg.PoolClient,
  familyId: string,
  row: LockedRow,
): Promise<DeliveryCandidate> {
  const consent = await client.query<{ confirmed: boolean }>(
    `SELECT consent_status = 'confirmed' AS confirmed FROM health_profiles WHERE id = $1 AND family_id = $2`,
    [row.profileId, familyId],
  );
  const assigned = await client.query<{ accountId: string }>(
    `SELECT account_id AS "accountId" FROM reminder_recipients WHERE health_profile_id = $1 AND family_id = $2`,
    [row.profileId, familyId],
  );
  const { deviceId, accountId, endpoint, p256dh, auth } = row;
  const device =
    deviceId && accountId && endpoint && p256dh && auth
      ? { id: deviceId, accountId, subscription: { endpoint, keys: { p256dh, auth } } }
      : null;
  return {
    kind: row.kind,
    deliveryId: row.deliveryId,
    reminderId: row.reminderId,
    profileId: row.profileId,
    scheduledAt: row.scheduledAt,
    attempts: row.attempts,
    consentConfirmed: consent.rows[0]?.confirmed ?? false,
    familyAccounts: await queryFamilyAccounts(client, familyId),
    assignedAccountIds: assigned.rows.map((r) => r.accountId),
    device,
  };
}

// Ghi ledger trước rồi mới gỡ đăng ký: FK ON DELETE SET NULL sau đó chỉ null push_subscription_id của dòng
// đã cập nhật trong cùng transaction. DELETE có điều kiện endpoint_hash đọc lúc khóa → không xóa endpoint mới.
async function applyUpdate(
  client: pg.PoolClient,
  row: LockedRow,
  update: DeliveryUpdate,
  now: Date,
): Promise<void> {
  await client.query(
    `UPDATE reminder_deliveries
        SET status = $2, attempts = $3, next_attempt_at = COALESCE($4::timestamptz, next_attempt_at),
            accepted_at = COALESCE($5::timestamptz, accepted_at), last_error = $6, updated_at = $7
      WHERE id = $1`,
    [
      row.deliveryId,
      update.status,
      update.attempts,
      update.nextAttemptAt ?? null,
      update.acceptedAt ?? null,
      update.lastError ?? null,
      now,
    ],
  );
  if (update.removeDevice && row.deviceId && row.endpointHash)
    await client.query('DELETE FROM push_subscriptions WHERE id = $1 AND endpoint_hash = $2', [
      row.deviceId,
      row.endpointHash,
    ]);
}

// SPEC-027 §5.2: một đích / một transaction trong withFamilyScope; COMMIT sau khi ghi kết quả.
export function processNextDelivery(
  pool: pg.Pool,
  familyId: string,
  clock: () => Date,
  decide: (candidate: DeliveryCandidate) => Promise<DeliveryUpdate>,
): Promise<DeliveryUpdate | null> {
  return withFamilyScope(pool, familyId, async (client) => {
    const row = await lockNextDue(client, familyId, clock());
    if (!row) return null;
    const update = await decide(await toCandidate(client, familyId, row));
    await applyUpdate(client, row, update, clock());
    return update;
  });
}
