import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('E26-S1-T2: nguồn phiên và Push', () => {
  let db: TestDatabase;
  let app: pg.Client;
  let accountId: string;
  let familyId: string;

  const insertSession = (method: string | null, id = randomUUID()) =>
    app.query(
      `INSERT INTO sessions(id, account_id, csrf_token, expires_at, auth_method)
       VALUES($1, $2, 'csrf-test', now() + interval '1 day', $3)`,
      [id, accountId, method],
    );

  const insertPush = (method: string | null, sessionId: string | null = null) =>
    app.query(
      `INSERT INTO push_subscriptions
         (id, family_id, account_id, last_session_id, auth_method, authorized_at,
          endpoint, endpoint_hash, p256dh, auth)
       VALUES($1::uuid, $2, $3, $4, $5, now(), 'https://push.example.test', $1::uuid::text, 'key', 'auth')`,
      [randomUUID(), familyId, accountId, sessionId, method],
    );

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
  });

  beforeEach(async () => {
    accountId = randomUUID();
    familyId = randomUUID();
    await app.query('BEGIN');
    await app.query("SELECT set_config('app.family_id', $1, true)", [familyId]);
    await app.query("INSERT INTO families(id, name) VALUES($1, 'Nhà thử')", [familyId]);
    await app.query(
      `INSERT INTO accounts(id, display_name, family_id, family_role)
       VALUES($1, 'Tài khoản thử', $2, 'member')`,
      [accountId, familyId],
    );
  });

  afterEach(async () => {
    await app.query('ROLLBACK');
  });

  afterAll(async () => {
    await app?.end();
    await db?.container.stop();
  });

  it.each(['local', 'oidc'])('nguồn %s được lưu và còn nguyên khi phiên gốc bị xóa', async (method) => {
    const sessionId = randomUUID();
    await insertSession(method, sessionId);
    await insertPush(method, sessionId);
    expect(
      (
        await app.query(
          `SELECT auth_method, oidc_auth_time, password_change_required
             FROM sessions WHERE id = $1`,
          [sessionId],
        )
      ).rows,
    ).toEqual([{ auth_method: method, oidc_auth_time: null, password_change_required: false }]);
    await app.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    expect((await app.query('SELECT auth_method, last_session_id FROM push_subscriptions')).rows).toEqual([
      { auth_method: method, last_session_id: null },
    ]);
  });

  it('một account có thể đồng thời giữ phiên và Push của hai nguồn', async () => {
    for (const method of ['local', 'oidc']) {
      await insertSession(method);
      await insertPush(method);
    }
    for (const table of ['sessions', 'push_subscriptions']) {
      const result = await app.query(`SELECT auth_method FROM ${table} ORDER BY auth_method`);
      expect(result.rows).toEqual([{ auth_method: 'local' }, { auth_method: 'oidc' }]);
    }
  });

  it.each(['sessions', 'push_subscriptions'])('%s từ chối nguồn ngoài local/oidc', async (table) => {
    const result = table === 'sessions' ? insertSession('other') : insertPush('other');
    await expect(result).rejects.toMatchObject({
      code: '23514',
      constraint: `${table}_auth_method_valid`,
    });
  });

  it.each(['sessions', 'push_subscriptions'])('%s không nhận nguồn NULL', async (table) => {
    const result = table === 'sessions' ? insertSession(null) : insertPush(null);
    await expect(result).rejects.toMatchObject({ code: '23502', column: 'auth_method' });
  });

  it('Push từ chối liên kết tới phiên không tồn tại', async () => {
    await expect(insertPush('local', randomUUID())).rejects.toMatchObject({ code: '23503' });
  });
});
