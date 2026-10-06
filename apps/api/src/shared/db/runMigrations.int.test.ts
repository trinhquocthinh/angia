import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from './runMigrations.js';

const SKELETON_TABLES = [
  'accounts',
  'consent_invitations',
  'consent_legacy_attestations',
  'extractions',
  'families',
  'health_profiles',
  'measurements',
  'sessions',
  'source_documents',
  'upload_batches',
];
// Bảng dữ liệu sức khỏe bắt buộc RLS (Tech Spec §3); families/accounts/sessions phục vụ xác thực.
const RLS_TABLES = [
  'consent_invitations',
  'consent_legacy_attestations',
  'extractions',
  'health_profiles',
  'measurements',
  'source_documents',
  'upload_batches',
];

describe('runMigrations trên PostgreSQL rỗng', () => {
  let db: TestDatabase;
  let owner: pg.Client;

  beforeAll(async () => {
    db = await startTestDatabase();
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  it('lần đầu áp dụng migration, lần sau không còn migration chờ', async () => {
    expect(await runMigrations(db.ownerUrl)).toBeGreaterThan(0);
    expect(await runMigrations(db.ownerUrl)).toBe(0);
  });

  it('tạo đủ các bảng đã khai báo trong schema public', async () => {
    const { rows } = await owner.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    expect(rows.map((row) => row.tablename)).toEqual(SKELETON_TABLES);
  });

  it('chỉ bật RLS kèm family_isolation_policy trên bảng dữ liệu sức khỏe', async () => {
    const { rows } = await owner.query<{ relname: string }>(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity ORDER BY c.relname`,
    );
    expect(rows.map((row) => row.relname)).toEqual(RLS_TABLES);

    const policies = await owner.query<{ tablename: string; qual: string }>(
      `SELECT tablename, qual FROM pg_policies
       WHERE schemaname = 'public' AND policyname = 'family_isolation_policy' AND cmd = 'ALL'
       ORDER BY tablename`,
    );
    expect(policies.rows.map((row) => row.tablename)).toEqual(RLS_TABLES);
    for (const policy of policies.rows) {
      expect(policy.qual).toContain("NULLIF(current_setting('app.family_id'::text, true), ''::text)");
    }
  });

  it('role app đọc/ghi được bảng mới nhờ default privileges', async () => {
    const app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    try {
      const { rows } = await app.query<{ bypass: boolean }>(
        `SELECT rolbypassrls AS bypass FROM pg_roles WHERE rolname = current_user`,
      );
      expect(rows[0]?.bypass).toBe(false);
      await expect(app.query('SELECT count(*) FROM health_profiles')).resolves.toBeDefined();
    } finally {
      await app.end();
    }
  });
});
