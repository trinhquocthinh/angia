import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FAMILY_DELETION_ROLE } from '@src/shared/test/expectedRlsPolicies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('E29-S1-T3: lược đồ token đặt lại mật khẩu qua email', () => {
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
  const insertToken = (accountId: string, tokenHash: string) =>
    app.query(
      `INSERT INTO password_reset_tokens(id, account_id, token_hash, expires_at)
       VALUES($1, $2, $3, now() + interval '30 minutes')`,
      [randomUUID(), accountId, tokenHash],
    );

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

  it('token_hash duy nhất và token bị xoá theo tài khoản', async () => {
    const account = await insertAccount();
    await insertToken(account, 'b'.repeat(64));
    await app.query('SAVEPOINT dup');
    await expect(insertToken(account, 'b'.repeat(64))).rejects.toMatchObject({
      code: '23505',
      constraint: 'password_reset_tokens_token_hash_unique',
    });
    await app.query('ROLLBACK TO SAVEPOINT dup');
    await app.query('DELETE FROM accounts WHERE id = $1', [account]);
    const { rowCount } = await app.query('SELECT 1 FROM password_reset_tokens WHERE account_id = $1', [
      account,
    ]);
    expect(rowCount).toBe(0);
  });

  it('bảng token không RLS family, chỉ role app có quyền, role xoá nhà không đọc được', async () => {
    const { rows } = await app.query<{ rls: boolean; app_priv: boolean; deletion_priv: boolean }>(
      `SELECT c.relrowsecurity AS rls,
              has_table_privilege(current_user, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS app_priv,
              has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS deletion_priv
       FROM pg_class c WHERE c.oid = 'public.password_reset_tokens'::regclass`,
      [FAMILY_DELETION_ROLE],
    );
    expect(rows).toEqual([{ rls: false, app_priv: true, deletion_priv: false }]);
  });
});
