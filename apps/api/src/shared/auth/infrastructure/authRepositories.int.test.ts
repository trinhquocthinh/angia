import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createAccountRepository } from './createAccountRepository.js';
import { createSessionRepository } from './createSessionRepository.js';

// Chạy bằng role app NOBYPASSRLS như runtime: accounts/sessions không áp RLS nên không cần withFamilyScope.
describe('Repository accounts/sessions trên PostgreSQL thật', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let owner: pg.Client;

  const accountRow = async (subject: string) => {
    const { rows } = await owner.query(
      `SELECT id, display_name, is_system_admin, family_id, family_role FROM accounts WHERE oidc_subject = $1`,
      [subject],
    );
    return rows;
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    pool = new pg.Pool({ connectionString: db.appUrl });
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
  });

  afterAll(async () => {
    await owner?.end();
    await pool?.end();
    await db?.container.stop();
  });

  it('lần đăng nhập đầu tạo tài khoản chờ gán nhóm (family_id, family_role null)', async () => {
    const accounts = createAccountRepository(createDatabase(pool));
    const { id } = await accounts.upsertFromIdentity({
      oidcSubject: 'sub-new',
      displayName: 'An',
      isSystemAdmin: false,
    });
    expect(await accountRow('sub-new')).toEqual([
      { id, display_name: 'An', is_system_admin: false, family_id: null, family_role: null },
    ]);
  });

  it('đăng nhập lại cập nhật tên + is_system_admin, giữ nguyên id và nhóm/vai trò đã gán', async () => {
    const accounts = createAccountRepository(createDatabase(pool));
    const first = await accounts.upsertFromIdentity({
      oidcSubject: 'sub-x',
      displayName: 'Cũ',
      isSystemAdmin: true,
    });
    const familyId = randomUUID();
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, 'Nhà X')`, [familyId]);
    await owner.query(`UPDATE accounts SET family_id = $1, family_role = 'main' WHERE id = $2`, [
      familyId,
      first.id,
    ]);

    const second = await accounts.upsertFromIdentity({
      oidcSubject: 'sub-x',
      displayName: 'Mới',
      isSystemAdmin: false,
    });

    expect(second.id).toBe(first.id);
    expect(await accountRow('sub-x')).toEqual([
      { id: first.id, display_name: 'Mới', is_system_admin: false, family_id: familyId, family_role: 'main' },
    ]);
  });

  it('tạo phiên gắn tài khoản với csrf_token và expires_at đã cho', async () => {
    const database = createDatabase(pool);
    const account = await createAccountRepository(database).upsertFromIdentity({
      oidcSubject: 'sub-session',
      displayName: 'B',
      isSystemAdmin: false,
    });
    const expiresAt = new Date('2026-11-04T03:00:00.000Z');
    const session = await createSessionRepository(database).create({
      accountId: account.id,
      csrfToken: 'tok',
      expiresAt,
    });

    const { rows } = await owner.query(
      `SELECT account_id, csrf_token, expires_at FROM sessions WHERE id = $1`,
      [session.id],
    );
    expect(rows).toEqual([{ account_id: account.id, csrf_token: 'tok', expires_at: expiresAt }]);
  });
});
