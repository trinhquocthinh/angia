import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FAMILY_DELETION_ROLE } from '@src/shared/test/expectedRlsPolicies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('E29-S1-T2: lược đồ email tùy chọn và token xác minh email', () => {
  let db: TestDatabase;
  let app: pg.Client;

  const insertAccount = async (email: string | null, verified = false) => {
    const id = randomUUID();
    await app.query(
      `INSERT INTO accounts(id, display_name, username_normalized, email, email_verified_at)
       VALUES($1, 'Tài khoản thử', $2, $3, $4)`,
      [id, `u.${id.slice(0, 8)}`, email, verified ? new Date() : null],
    );
    return id;
  };
  const insertToken = (
    accountId: string,
    tokenHash = createHash('sha256').update(randomBytes(32)).digest('hex'),
  ) =>
    app.query(
      `INSERT INTO email_verification_tokens(id, account_id, email, token_hash, expires_at)
       VALUES($1, $2, 'lan@example.com', $3, now() + interval '24 hours')`,
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

  it('TC-922: hai tài khoản được cùng ghi một email chưa xác minh', async () => {
    await insertAccount('lan@example.com');
    await expect(insertAccount('lan@example.com')).resolves.toBeTypeOf('string');
    await expect(insertAccount(null)).resolves.toBeTypeOf('string');
  });

  it('TC-931: email đã xác minh là duy nhất không phân biệt hoa thường', async () => {
    await insertAccount('lan@example.com', true);
    const other = await insertAccount('LAN@example.com');
    await expect(
      app.query('UPDATE accounts SET email_verified_at = now() WHERE id = $1', [other]),
    ).rejects.toMatchObject({ code: '23505', constraint: 'accounts_verified_email_unique' });
  });

  it('token_hash duy nhất và token bị xoá theo tài khoản', async () => {
    const account = await insertAccount('lan@example.com');
    await insertToken(account, 'a'.repeat(64));
    await app.query('SAVEPOINT dup');
    await expect(insertToken(account, 'a'.repeat(64))).rejects.toMatchObject({
      code: '23505',
      constraint: 'email_verification_tokens_token_hash_unique',
    });
    await app.query('ROLLBACK TO SAVEPOINT dup');
    await app.query('DELETE FROM accounts WHERE id = $1', [account]);
    const { rowCount } = await app.query('SELECT 1 FROM email_verification_tokens WHERE account_id = $1', [
      account,
    ]);
    expect(rowCount).toBe(0);
  });

  it('bảng token không RLS family, chỉ role app có quyền, role xoá nhà không đọc được', async () => {
    const { rows } = await app.query<{ rls: boolean; app_priv: boolean; deletion_priv: boolean }>(
      `SELECT c.relrowsecurity AS rls,
              has_table_privilege(current_user, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS app_priv,
              has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS deletion_priv
       FROM pg_class c WHERE c.oid = 'public.email_verification_tokens'::regclass`,
      [FAMILY_DELETION_ROLE],
    );
    expect(rows).toEqual([{ rls: false, app_priv: true, deletion_priv: false }]);
  });
});
