import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { prepareLocalIdentityMigration } from '@src/shared/test/prepareLocalIdentityMigration.js';
import { runMigrations } from './runMigrations.js';

describe('E26-S1-T1: migration nền cho tài khoản local', () => {
  let fixture: Awaited<ReturnType<typeof prepareLocalIdentityMigration>>;

  beforeAll(async () => {
    fixture = await prepareLocalIdentityMigration();
    expect(await runMigrations(fixture.db.ownerUrl)).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await fixture?.owner.end();
    await fixture?.db.container.stop();
  });

  it('giữ nguyên dữ liệu, subject, gia đình và liên kết hồ sơ cũ', async () => {
    for (const [table, rows] of Object.entries(fixture.before)) {
      const result = await fixture.owner.query(`SELECT * FROM ${table} ORDER BY id`);
      expect(result.rows).toHaveLength(rows.length);
      for (const [index, row] of rows.entries()) expect(result.rows[index]).toMatchObject(row);
    }
    const result = await fixture.owner.query(
      'SELECT username_normalized, legal_ref FROM accounts WHERE id = $1',
      [fixture.accountId],
    );
    expect(result.rows[0]).toMatchObject({ username_normalized: null, legal_ref: expect.any(String) });
    expect(result.rows[0].legal_ref).not.toBe(fixture.accountId);
  });

  it('backfill nguồn OIDC, không giả thời điểm reauth và giữ nguồn Push khi mất phiên', async () => {
    expect(
      (
        await fixture.owner.query(
          'SELECT auth_method, oidc_auth_time, password_change_required FROM sessions',
        )
      ).rows,
    ).toEqual([{ auth_method: 'oidc', oidc_auth_time: null, password_change_required: false }]);
    const result = await fixture.owner.query(
      'SELECT auth_method, last_session_id FROM push_subscriptions ORDER BY id',
    );
    expect(result.rows).toHaveLength(2);
    expect(result.rows.every((row) => row.auth_method === 'oidc')).toBe(true);
    expect(result.rows.some((row) => row.last_session_id === null)).toBe(true);
    expect((await fixture.owner.query('SELECT * FROM account_credentials')).rows).toEqual([]);
  });

  it('tạo account local, credential và giữ bản đồng ý bất biến sau khi xoá account', async () => {
    const accountId = randomUUID();
    const versionId = randomUUID();
    const acceptanceId = randomUUID();
    const account = await fixture.owner.query<{ legal_ref: string }>(
      `INSERT INTO accounts(id,display_name,username_normalized)
       VALUES($1,'Tài khoản thử','tai.khoan.thu') RETURNING legal_ref`,
      [accountId],
    );
    await fixture.owner.query(
      `INSERT INTO account_credentials(account_id,password_hash)
       VALUES($1,'$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA')`,
      [accountId],
    );
    await fixture.owner.query(
      `INSERT INTO legal_document_versions(id,kind,version,published_at,material,content_path,sha256)
       VALUES($1,'terms','test',now(),true,'legal/test.md',repeat('a',64))`,
      [versionId],
    );
    await fixture.owner.query('INSERT INTO legal_acceptances(id,account_ref,version_id) VALUES($1,$2,$3)', [
      acceptanceId,
      account.rows[0]!.legal_ref,
      versionId,
    ]);
    const before = await fixture.owner.query('SELECT * FROM legal_acceptances WHERE id = $1', [acceptanceId]);
    await fixture.owner.query('DELETE FROM accounts WHERE id = $1', [accountId]);
    expect(
      (await fixture.owner.query('SELECT * FROM account_credentials WHERE account_id = $1', [accountId]))
        .rows,
    ).toEqual([]);
    expect(
      (await fixture.owner.query('SELECT * FROM legal_acceptances WHERE id = $1', [acceptanceId])).rows,
    ).toEqual(before.rows);
  });

  it('role app chỉ INSERT/SELECT bản đồng ý và vẫn NOBYPASSRLS', async () => {
    const app = new pg.Client({ connectionString: fixture.db.appUrl });
    await app.connect();
    try {
      const result = await app.query(
        `SELECT rolbypassrls, rolsuper,
           has_table_privilege(current_user,'legal_acceptances','SELECT') AS can_select,
           has_table_privilege(current_user,'legal_acceptances','INSERT') AS can_insert,
           has_table_privilege(current_user,'legal_acceptances','UPDATE') AS can_update,
           has_table_privilege(current_user,'legal_acceptances','DELETE') AS can_delete,
           has_table_privilege(current_user,'legal_acceptances','TRUNCATE') AS can_truncate
         FROM pg_roles WHERE rolname = current_user`,
      );
      expect(result.rows).toEqual([
        {
          rolbypassrls: false,
          rolsuper: false,
          can_select: true,
          can_insert: true,
          can_update: false,
          can_delete: false,
          can_truncate: false,
        },
      ]);
    } finally {
      await app.end();
    }
  });

  it('chạy lại không áp dụng migration và không đổi legal_ref', async () => {
    const before = await fixture.owner.query('SELECT id, legal_ref FROM accounts ORDER BY id');
    expect(await runMigrations(fixture.db.ownerUrl)).toBe(0);
    expect((await fixture.owner.query('SELECT id, legal_ref FROM accounts ORDER BY id')).rows).toEqual(
      before.rows,
    );
  });
});
