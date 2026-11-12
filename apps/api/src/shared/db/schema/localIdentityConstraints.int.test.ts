import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

const PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA';

describe('E26-S1-T2: ràng buộc, quyền và transaction tài khoản local', () => {
  let db: TestDatabase;
  let app: pg.Client;
  const versionId = randomUUID();
  const persistedAcceptanceId = randomUUID();

  const insertAccount = async (id = randomUUID(), username = `u.${randomUUID().slice(0, 8)}`) => {
    const result = await app.query<{ legal_ref: string }>(
      `INSERT INTO accounts(id, display_name, username_normalized)
       VALUES($1, 'Tài khoản thử', $2) RETURNING legal_ref`,
      [id, username],
    );
    return { id, legalRef: result.rows[0]!.legal_ref };
  };

  const insertCredential = (accountId: string, hash = PASSWORD_HASH, version = 1) =>
    app.query(
      `INSERT INTO account_credentials(account_id, password_hash, credential_version)
       VALUES($1, $2, $3)`,
      [accountId, hash, version],
    );

  const insertAcceptance = (legalRef: string, documentId = versionId) =>
    app.query(`INSERT INTO legal_acceptances(id, account_ref, version_id) VALUES($1, $2, $3)`, [
      randomUUID(),
      legalRef,
      documentId,
    ]);

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    const owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    try {
      await owner.query(
        `INSERT INTO legal_document_versions
           (id, kind, version, published_at, material, content_path, sha256)
         VALUES($1, 'terms', 'test', now(), true, 'legal/test.md', repeat('a', 64))`,
        [versionId],
      );
    } finally {
      await owner.end();
    }
    app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    await app.query(
      `INSERT INTO legal_acceptances(id, account_ref, version_id, accepted_at)
       VALUES($1, $2, $3, '2026-01-01T00:00:00Z')`,
      [persistedAcceptanceId, randomUUID(), versionId],
    );
  });

  beforeEach(async () => {
    await app.query('BEGIN');
  });

  afterEach(async () => {
    await app.query('ROLLBACK');
  });

  afterAll(async () => {
    await app?.end();
    await db?.container.stop();
  });

  it('role app không là superuser, không bypass RLS và không sở hữu bảng legal', async () => {
    const result = await app.query(
      `SELECT r.rolsuper, r.rolbypassrls, c.relowner = r.oid AS owns_table
       FROM pg_roles r
       JOIN pg_class c ON c.oid = 'public.legal_acceptances'::regclass
       WHERE r.rolname = current_user`,
    );
    expect(result.rows).toEqual([{ rolsuper: false, rolbypassrls: false, owns_table: false }]);
  });

  it('credential mặc định version 1 và có updated_at', async () => {
    const account = await insertAccount();
    await app.query('INSERT INTO account_credentials(account_id, password_hash) VALUES($1, $2)', [
      account.id,
      PASSWORD_HASH,
    ]);
    const result = await app.query(
      'SELECT credential_version, updated_at FROM account_credentials WHERE account_id = $1',
      [account.id],
    );
    expect(result.rows).toEqual([{ credential_version: 1, updated_at: expect.any(Date) }]);
  });

  it('mỗi account chỉ có một credential', async () => {
    const account = await insertAccount();
    await insertCredential(account.id);
    await expect(insertCredential(account.id)).rejects.toMatchObject({ code: '23505' });
  });

  it('credential không được trỏ tới account không tồn tại', async () => {
    await expect(insertCredential(randomUUID())).rejects.toMatchObject({ code: '23503' });
  });

  it.each([0, -1])('credential_version = %i bị từ chối', async (version) => {
    const account = await insertAccount();
    await expect(insertCredential(account.id, PASSWORD_HASH, version)).rejects.toMatchObject({
      code: '23514',
      constraint: 'account_credentials_version_positive',
    });
  });

  it.each([
    'plaintext',
    PASSWORD_HASH.replace('argon2id', 'argon2i'),
    PASSWORD_HASH.replace('v=19', 'v=16'),
    PASSWORD_HASH.replace('m=65536', 'm=0'),
  ])('hash sai định dạng PHC bị từ chối: %s', async (hash) => {
    const account = await insertAccount();
    await expect(insertCredential(account.id, hash)).rejects.toMatchObject({
      code: '23514',
      constraint: 'account_credentials_hash_phc',
    });
  });

  it('username đã chuẩn hoá phải duy nhất', async () => {
    await insertAccount(randomUUID(), 'me.lan');
    await expect(insertAccount(randomUUID(), 'me.lan')).rejects.toMatchObject({
      code: '23505',
      constraint: 'accounts_username_normalized_unique',
    });
  });

  it.each(['Me.Lan', 'ab', 'a'.repeat(33), 'me lan'])(
    'username ngoài định dạng lưu trữ bị từ chối: %s',
    async (username) => {
      await expect(insertAccount(randomUUID(), username)).rejects.toMatchObject({
        code: '23514',
        constraint: 'accounts_username_normalized_valid',
      });
    },
  );

  it('legal_ref phải duy nhất giữa hai account', async () => {
    const first = await insertAccount();
    const second = await insertAccount();
    await expect(
      app.query('UPDATE accounts SET legal_ref = $1 WHERE id = $2', [first.legalRef, second.id]),
    ).rejects.toMatchObject({
      code: '23505',
      constraint: 'accounts_legal_ref_unique',
    });
  });

  it('app thêm/đọc legal và xóa account không làm mất hay sửa bản đồng ý', async () => {
    const account = await insertAccount();
    await insertCredential(account.id);
    await insertAcceptance(account.legalRef);
    const before = await app.query('SELECT * FROM legal_acceptances WHERE account_ref = $1', [
      account.legalRef,
    ]);
    expect(before.rows).toHaveLength(1);
    await app.query('DELETE FROM accounts WHERE id = $1', [account.id]);
    expect(
      (await app.query('SELECT * FROM account_credentials WHERE account_id = $1', [account.id])).rows,
    ).toEqual([]);
    expect(
      (await app.query('SELECT * FROM legal_acceptances WHERE account_ref = $1', [account.legalRef])).rows,
    ).toEqual(before.rows);
  });

  it('mỗi account_ref chỉ đồng ý một lần cho mỗi version', async () => {
    const account = await insertAccount();
    await insertAcceptance(account.legalRef);
    await expect(insertAcceptance(account.legalRef)).rejects.toMatchObject({
      code: '23505',
      constraint: 'legal_acceptances_account_version_unique',
    });
  });

  it('bản đồng ý không được trỏ tới version không tồn tại', async () => {
    await expect(insertAcceptance(randomUUID(), randomUUID())).rejects.toMatchObject({ code: '23503' });
  });

  it.each([
    'UPDATE legal_acceptances SET accepted_at = now()',
    'DELETE FROM legal_acceptances',
    'TRUNCATE TABLE legal_acceptances',
  ])('app bị từ chối lệnh sửa lịch sử: %s', async (statement) => {
    const before = await app.query('SELECT * FROM legal_acceptances WHERE id = $1', [persistedAcceptanceId]);
    expect(before.rows).toHaveLength(1);
    await expect(app.query(statement)).rejects.toMatchObject({ code: '42501' });
    await app.query('ROLLBACK');
    await app.query('BEGIN');
    expect(
      (await app.query('SELECT * FROM legal_acceptances WHERE id = $1', [persistedAcceptanceId])).rows,
    ).toEqual(before.rows);
  });

  it.each(['credential', 'legal', 'membership'])(
    'TC-896 (nền DB): lỗi tại %s rollback account, credential và legal',
    async (stage) => {
      const account = await insertAccount();
      if (stage !== 'credential') await insertCredential(account.id);
      if (stage !== 'credential') await insertAcceptance(account.legalRef);
      const failure =
        stage === 'credential'
          ? insertCredential(account.id, 'invalid')
          : stage === 'legal'
            ? insertAcceptance(account.legalRef, randomUUID())
            : app.query('UPDATE accounts SET family_id = $1 WHERE id = $2', [randomUUID(), account.id]);
      await expect(failure).rejects.toMatchObject({
        code: stage === 'credential' ? '23514' : '23503',
      });
      await app.query('ROLLBACK');
      await app.query('BEGIN');
      for (const [table, column, value] of [
        ['accounts', 'id', account.id],
        ['account_credentials', 'account_id', account.id],
        ['legal_acceptances', 'account_ref', account.legalRef],
      ]) {
        const result = await app.query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [value]);
        expect(result.rows).toEqual([]);
      }
    },
  );
});
