import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

// Ràng buộc ledger gửi lời nhắc theo thiết bị (E9-S2-T2, spec §4); dựng dữ liệu bằng role owner.
describe('Ràng buộc bảng reminder_deliveries', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const profileId = randomUUID();
  const accountId = randomUUID();

  const insertReminder = async (slot: string) => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO reminders (id, family_id, health_profile_id, date, slot, scheduled_at, medications)
       VALUES ($1, $2, $3, '2026-10-23', $4, '2026-10-23T00:00:00Z', '[{"courseId":"c"}]')`,
      [id, familyId, profileId, slot],
    );
    return id;
  };
  const insertDevice = async () => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO push_subscriptions (id, family_id, account_id, authorized_at, endpoint, endpoint_hash, p256dh, auth)
       VALUES ($1, $2, $3, now(), $4, $5, 'p', 'a')`,
      [id, familyId, accountId, `https://push.example/${id}`, `hash-${id}`],
    );
    return id;
  };
  const insertDelivery = async (reminderId: string, deviceId: string | null, extra = '', values = '') => {
    const id = randomUUID();
    await owner.query(
      `INSERT INTO reminder_deliveries (id, family_id, reminder_id, push_subscription_id, status${extra})
       VALUES ($1, $2, $3, $4, 'pending'${values})`,
      [id, familyId, reminderId, deviceId],
    );
    return id;
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, 'Nhà A'), ($2, 'Nhà B')`, [
      familyId,
      otherFamilyId,
    ]);
    await owner.query(`INSERT INTO health_profiles (id, family_id, display_name) VALUES ($1, $2, 'Mẹ')`, [
      profileId,
      familyId,
    ]);
    await owner.query(
      `INSERT INTO accounts (id, oidc_subject, display_name, family_id, family_role) VALUES ($1, 'sub-1', 'Thịnh', $2, 'main')`,
      [accountId, familyId],
    );
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  it('fan-out chạy lại không tạo trùng: chặn trùng (reminder_id, push_subscription_id)', async () => {
    const reminderId = await insertReminder('morning');
    const deviceId = await insertDevice();
    await insertDelivery(reminderId, deviceId);
    await expect(insertDelivery(reminderId, deviceId)).rejects.toThrow(
      /reminder_deliveries_reminder_device_unique/,
    );
  });

  it('status ngoài tập trạng thái và attempts ngoài 0–6 bị CHECK từ chối', async () => {
    const reminderId = await insertReminder('noon');
    const deviceId = await insertDevice();
    await expect(
      owner.query(
        `INSERT INTO reminder_deliveries (id, family_id, reminder_id, push_subscription_id, status)
         VALUES ($1, $2, $3, $4, 'sent')`,
        [randomUUID(), familyId, reminderId, deviceId],
      ),
    ).rejects.toThrow(/reminder_deliveries_status_valid/);
    await expect(insertDelivery(reminderId, deviceId, ', attempts', ', 7')).rejects.toThrow(
      /reminder_deliveries_attempts_valid/,
    );
    await expect(insertDelivery(reminderId, deviceId, ', attempts', ', 6')).resolves.toBeDefined();
  });

  it('gỡ thiết bị giữ lịch sử: push_subscription_id về NULL, dòng ledger còn', async () => {
    const reminderId = await insertReminder('afternoon');
    const deviceId = await insertDevice();
    const deliveryId = await insertDelivery(reminderId, deviceId);
    await owner.query(`DELETE FROM push_subscriptions WHERE id = $1`, [deviceId]);
    const { rows } = await owner.query(
      `SELECT push_subscription_id, family_id FROM reminder_deliveries WHERE id = $1`,
      [deliveryId],
    );
    expect(rows).toEqual([{ push_subscription_id: null, family_id: familyId }]);
  });

  it('xóa lời nhắc xóa dây chuyền các dòng ledger của nó', async () => {
    const reminderId = await insertReminder('evening');
    const deliveryId = await insertDelivery(reminderId, await insertDevice());
    await owner.query(`DELETE FROM reminders WHERE id = $1`, [reminderId]);
    const { rowCount } = await owner.query(`SELECT 1 FROM reminder_deliveries WHERE id = $1`, [deliveryId]);
    expect(rowCount).toBe(0);
  });

  it('BR-003: role app với app.family_id của gia đình khác không thấy dòng ledger', async () => {
    const app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    try {
      await app.query('BEGIN');
      await app.query("SELECT set_config('app.family_id', $1, true)", [otherFamilyId]);
      const hidden = await app.query(`SELECT id FROM reminder_deliveries`);
      expect(hidden.rowCount).toBe(0);
      await app.query("SELECT set_config('app.family_id', $1, true)", [familyId]);
      const visible = await app.query(`SELECT id FROM reminder_deliveries`);
      expect(visible.rowCount).toBeGreaterThan(0);
      await app.query('ROLLBACK');
    } finally {
      await app.end();
    }
  });
});
