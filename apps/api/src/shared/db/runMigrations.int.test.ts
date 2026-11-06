import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import {
  EXPECTED_POLICIES,
  NOT_SELF,
  PAIN_JOURNAL_TABLES,
  RLS_TABLES,
  SELF_READ_ONLY_TABLES,
} from '@src/shared/test/expectedRlsPolicies.js';
import { runMigrations } from './runMigrations.js';

const SKELETON_TABLES = [
  'accounts',
  'adherence_periods',
  'ai_billing_sources',
  'ai_provider_charges',
  'ai_routing_audit',
  'ai_routing_settings',
  'as_needed_doses',
  'consent_invitations',
  'consent_legacy_attestations',
  'dose_confirmations',
  'dose_slots',
  'exercise_notes',
  'extraction_reservations',
  'extraction_spend',
  'extractions',
  'families',
  'family_extraction_spend',
  'family_scan_quotas',
  'health_profiles',
  'lab_results',
  'measurements',
  'medication_courses',
  'object_purges',
  'ocr_operations',
  'pain_entries',
  'pain_issue_status_events',
  'pain_issues',
  'prescription_items',
  'prescriptions',
  'profile_link_events',
  'profile_link_invitations',
  'push_subscriptions',
  'reminder_deliveries',
  'reminder_recipients',
  'reminders',
  'revisit_reminders',
  'scan_quota_audit',
  'scan_quota_months',
  'scan_quota_policy',
  'scan_quota_policy_audit',
  'sessions',
  'source_documents',
  'temperature_readings',
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

  it('TC-708: mỗi bảng RLS thuộc đúng một nhóm và có chính xác các policy đã quy định', async () => {
    const { rows } = await owner.query<{ relname: string }>(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity ORDER BY c.relname`,
    );
    expect(rows.map((row) => row.relname)).toEqual(RLS_TABLES);

    const policies = await owner.query<{
      tablename: string;
      policyname: string;
      permissive: string;
      roles: string[];
      cmd: string;
      qual: string | null;
      withCheck: string | null;
    }>(
      `SELECT tablename, policyname, permissive, roles::text[] AS roles,
              cmd, qual, with_check AS "withCheck"
       FROM pg_policies
       WHERE schemaname = 'public'
       ORDER BY tablename, policyname`,
    );
    expect([...PAIN_JOURNAL_TABLES, ...SELF_READ_ONLY_TABLES].sort()).toEqual(RLS_TABLES);
    expect(new Set([...PAIN_JOURNAL_TABLES, ...SELF_READ_ONLY_TABLES]).size).toBe(RLS_TABLES.length);
    const expected: typeof policies.rows = RLS_TABLES.map((tablename) => ({
      tablename,
      policyname: 'family_isolation_policy',
      permissive: 'PERMISSIVE',
      roles: ['public'],
      cmd: 'ALL',
      qual: EXPECTED_POLICIES[tablename]!,
      withCheck: null,
    }));
    for (const tablename of SELF_READ_ONLY_TABLES) {
      for (const cmd of ['INSERT', 'UPDATE', 'DELETE']) {
        expected.push({
          tablename,
          policyname: `self_read_only_${cmd.toLowerCase()}`,
          permissive: 'RESTRICTIVE',
          roles: ['public'],
          cmd,
          qual: cmd === 'INSERT' ? null : NOT_SELF,
          withCheck: cmd === 'DELETE' ? null : NOT_SELF,
        });
      }
    }
    expect(policies.rows).toEqual(
      expected.sort(
        (a, b) => a.tablename.localeCompare(b.tablename) || a.policyname.localeCompare(b.policyname),
      ),
    );
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
      await expect(app.query('SELECT count(*) FROM object_purges')).resolves.toBeDefined();
    } finally {
      await app.end();
    }
  });

  it('Nợ #11: schema pgboss do owner tạo; role app chỉ có DML, không được CREATE trong schema', async () => {
    const app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
    try {
      const { rows } = await app.query<{ version: number; canCreate: boolean }>(
        `SELECT (SELECT version FROM pgboss.version) AS version,
                has_schema_privilege(current_user, 'pgboss', 'CREATE') AS "canCreate"`,
      );
      expect(rows[0]).toEqual({ version: 44, canCreate: false });
      await expect(app.query('SELECT count(*) FROM pgboss.job')).resolves.toBeDefined();
    } finally {
      await app.end();
    }
  });
});
