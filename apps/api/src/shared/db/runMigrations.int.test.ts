import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from './runMigrations.js';

const SKELETON_TABLES = [
  'accounts',
  'adherence_periods',
  'ai_billing_sources',
  'ai_provider_charges',
  'ai_routing_audit',
  'ai_routing_settings',
  'consent_invitations',
  'consent_legacy_attestations',
  'dose_confirmations',
  'dose_slots',
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
  'upload_batches',
];
// Bảng dữ liệu sức khỏe bắt buộc RLS (Tech Spec §3); families/accounts/sessions phục vụ xác thực,
// extraction_spend là bảng quản trị ngân sách phi y tế (E3-S6-T1).
const RLS_TABLES = [
  'adherence_periods',
  'consent_invitations',
  'consent_legacy_attestations',
  'dose_confirmations',
  'dose_slots',
  'extraction_reservations',
  'extractions',
  'family_extraction_spend',
  'family_scan_quotas',
  'health_profiles',
  'lab_results',
  'measurements',
  'medication_courses',
  'object_purges',
  'ocr_operations',
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
  'source_documents',
  'upload_batches',
];

// TC-569: mỗi bảng RLS thuộc đúng một dạng policy (Tech Spec §3.9.3), so khớp nguyên văn sau khi PostgreSQL chuẩn hóa.
const SETTING = (name: string) => `NULLIF(current_setting('app.${name}'::text, true), ''::text)`;
const SAME_FAMILY = `(family_id = (${SETTING('family_id')})::uuid)`;
const NOT_SELF = `(${SETTING('self_profile_id')} IS NULL)`;
const FAMILY_ONLY_POLICY = `(${SAME_FAMILY} AND ${NOT_SELF})`;
const selfPolicy = (column: string) =>
  `(${SAME_FAMILY} AND (${NOT_SELF} OR (${column} = (${SETTING('self_profile_id')})::uuid)))`;
const EXPECTED_POLICIES: Record<string, string> = {
  adherence_periods: selfPolicy('health_profile_id'),
  consent_invitations: selfPolicy('profile_id'),
  consent_legacy_attestations: selfPolicy('profile_id'),
  dose_confirmations: selfPolicy('health_profile_id'),
  dose_slots: selfPolicy('health_profile_id'),
  extraction_reservations: FAMILY_ONLY_POLICY,
  extractions: FAMILY_ONLY_POLICY,
  family_extraction_spend: FAMILY_ONLY_POLICY,
  family_scan_quotas: FAMILY_ONLY_POLICY,
  health_profiles: selfPolicy('id'),
  lab_results: selfPolicy('health_profile_id'),
  measurements: selfPolicy('health_profile_id'),
  medication_courses: selfPolicy('health_profile_id'),
  object_purges: FAMILY_ONLY_POLICY,
  ocr_operations: FAMILY_ONLY_POLICY,
  prescription_items: `(${SAME_FAMILY} AND (${NOT_SELF} OR (EXISTS ( SELECT 1
   FROM prescriptions parent
  WHERE ((parent.id = prescription_items.prescription_id) AND (parent.health_profile_id = (${SETTING('self_profile_id')})::uuid))))))`,
  prescriptions: selfPolicy('health_profile_id'),
  profile_link_events: selfPolicy('profile_id'),
  profile_link_invitations: selfPolicy('profile_id'),
  push_subscriptions: FAMILY_ONLY_POLICY,
  reminder_deliveries: FAMILY_ONLY_POLICY,
  reminder_recipients: selfPolicy('health_profile_id'),
  reminders: selfPolicy('health_profile_id'),
  revisit_reminders: selfPolicy('health_profile_id'),
  scan_quota_audit: FAMILY_ONLY_POLICY,
  source_documents: selfPolicy('health_profile_id'),
  upload_batches: selfPolicy('health_profile_id'),
};

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
    expect(Object.fromEntries(policies.rows.map((row) => [row.tablename, row.qual]))).toEqual(
      EXPECTED_POLICIES,
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
