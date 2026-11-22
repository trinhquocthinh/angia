import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FAMILY_DELETION_ROLE } from '@src/shared/test/expectedRlsPolicies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('E29-S3-T1: lược đồ yêu cầu tải dữ liệu về', () => {
  let db: TestDatabase;
  let app: pg.Client;

  const insertAccount = async () => {
    const id = randomUUID();
    await app.query(
      `INSERT INTO accounts(id, display_name, username_normalized) VALUES($1, 'Tài khoản thử', $2)`,
      [id, `u.${id.slice(0, 8)}`],
    );
    return id;
  };
  const insertExport = (accountId: string, status: string, objectKey: string | null, expires: boolean) =>
    app.query(
      `INSERT INTO data_exports(id, account_id, status, object_key, expires_at)
       VALUES($1, $2, $3, $4, CASE WHEN $5::boolean THEN now() + interval '24 hours' END)`,
      [randomUUID(), accountId, status, objectKey, expires],
    );
  const expectViolation = async (run: () => Promise<unknown>, constraint: string) => {
    await app.query('SAVEPOINT s');
    await expect(run()).rejects.toMatchObject({ code: '23514', constraint });
    await app.query('ROLLBACK TO SAVEPOINT s');
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
  });
  beforeEach(() => app.query('BEGIN'));
  afterEach(() => app.query('ROLLBACK'));
  afterAll(async () => {
    await app?.end();
    await db?.container.stop();
  });

  it('ready bắt buộc có object_key và expires_at; trạng thái khác thì không', async () => {
    const account = await insertAccount();
    await insertExport(account, 'pending', null, false);
    await insertExport(account, 'ready', 'exports/a.zip', true);
    await expectViolation(() => insertExport(account, 'ready', null, true), 'data_exports_ready_complete');
    await expectViolation(
      () => insertExport(account, 'ready', 'exports/b.zip', false),
      'data_exports_ready_complete',
    );
    await expectViolation(
      () => insertExport(account, 'failed', 'exports/c.zip', true),
      'data_exports_ready_complete',
    );
    await expectViolation(() => insertExport(account, 'done', null, false), 'data_exports_status_valid');
  });

  it('yêu cầu bị xoá theo tài khoản; bảng không RLS family, role xoá nhà không chạm được', async () => {
    const account = await insertAccount();
    await insertExport(account, 'pending', null, false);
    await app.query('DELETE FROM accounts WHERE id = $1', [account]);
    const { rowCount } = await app.query('SELECT 1 FROM data_exports WHERE account_id = $1', [account]);
    expect(rowCount).toBe(0);
    const { rows } = await app.query<{ rls: boolean; app_priv: boolean; deletion_priv: boolean }>(
      `SELECT c.relrowsecurity AS rls,
              has_table_privilege(current_user, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS app_priv,
              has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS deletion_priv
       FROM pg_class c WHERE c.oid = 'public.data_exports'::regclass`,
      [FAMILY_DELETION_ROLE],
    );
    expect(rows).toEqual([{ rls: false, app_priv: true, deletion_priv: false }]);
  });
});
