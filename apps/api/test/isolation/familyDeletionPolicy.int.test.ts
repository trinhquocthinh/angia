import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHouseholdDatabase } from '@src/shared/test/startHouseholdDatabase.js';
import { FAMILY_DELETION_ROLE } from '@src/shared/test/expectedRlsPolicies.js';
import { asFamilyDeletionRole, seedFamilyDeletionCase } from '@src/shared/test/seedFamilyDeletionCase.js';

const POLICY = 'family_deletion_due_only';
// Bảng có family_id cố ý không gắn policy xoá nhà; thêm bảng mới vào đây phải kèm lý do.
const RETAINED: Record<string, string> = {
  accounts: 'không bật RLS; role chỉ SELECT, gỡ Chủ hộ khỏi nhà do finalize_family_deletion làm',
  admin_audit_events: 'nhật ký BR-084 còn sau khi xoá nhà; role chỉ INSERT, không đọc',
  scan_quota_audit: 'nhật ký quota append-only, không FK tới nhà (D3); role không có quyền',
};

describe('TC-869: policy family_deletion_due_only — chống lệch, quyền tối thiểu, phá thử', () => {
  let t: Awaited<ReturnType<typeof startHouseholdDatabase>>;
  beforeAll(async () => {
    t = await startHouseholdDatabase();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-869: mọi bảng có family_id có policy RESTRICTIVE cho role xoá nhà hoặc nằm trong danh sách giữ lại', async () => {
    const columns = await t.owner.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.columns
       WHERE table_schema='public' AND column_name='family_id' ORDER BY table_name`,
    );
    const policies = await t.owner.query<{ tablename: string }>(
      `SELECT tablename FROM pg_policies WHERE schemaname='public' AND policyname=$1
         AND permissive='RESTRICTIVE' AND cmd='ALL' AND roles::text[]=ARRAY[$2]::text[]
       ORDER BY tablename`,
      [POLICY, FAMILY_DELETION_ROLE],
    );
    const tables = columns.rows.map((row) => row.table_name);
    expect(Object.keys(RETAINED).filter((table) => !tables.includes(table))).toEqual([]);
    expect(policies.rows.map((row) => row.tablename)).toEqual(tables.filter((table) => !(table in RETAINED)));
  });

  it('TC-869: role NOLOGIN NOBYPASSRLS, app chỉ SET ROLE (không INHERIT), grant đúng D1', async () => {
    const role = await t.owner.query(
      `SELECT r.rolcanlogin,r.rolbypassrls,r.rolsuper,m.inherit_option,m.set_option,m.admin_option
       FROM pg_roles r JOIN pg_auth_members m ON m.roleid=r.oid
       WHERE r.rolname=$1 AND m.member='angia_test_app'::regrole`,
      [FAMILY_DELETION_ROLE],
    );
    expect(role.rows).toEqual([
      {
        rolcanlogin: false,
        rolbypassrls: false,
        rolsuper: false,
        inherit_option: false,
        set_option: true,
        admin_option: false,
      },
    ]);
    const grants = await t.owner.query<{ relation: string; privileges: string }>(
      `SELECT n.nspname||'.'||c.relname AS relation,
              string_agg(a.privilege_type,',' ORDER BY a.privilege_type) AS privileges
       FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN aclexplode(c.relacl) a
       WHERE a.grantee=$1::regrole GROUP BY 1 ORDER BY 1`,
      [FAMILY_DELETION_ROLE],
    );
    const policyTables = await t.owner.query<{ tablename: string }>(
      'SELECT tablename FROM pg_policies WHERE policyname=$1 ORDER BY tablename',
      [POLICY],
    );
    const special: Record<string, string> = {
      'public.accounts': 'SELECT',
      'public.admin_audit_events': 'INSERT',
      'public.family_deletion_requests': 'SELECT,UPDATE',
      'public.object_purges': 'INSERT',
      'pgboss.job_common': 'INSERT',
      'pgboss.queue': 'SELECT',
    };
    const expected = Object.fromEntries(
      policyTables.rows.map(({ tablename }) => [`public.${tablename}`, 'DELETE,SELECT']),
    );
    expect(Object.fromEntries(grants.rows.map((row) => [row.relation, row.privileges]))).toEqual({
      ...expected,
      ...special,
    });
    const columns = await t.owner.query(
      `SELECT has_column_privilege($1,'pgboss.job_common','id','SELECT') AS id,
              has_column_privilege($1,'pgboss.job_common','data','SELECT') AS data`,
      [FAMILY_DELETION_ROLE],
    );
    expect(columns.rows).toEqual([{ id: true, data: false }]);
    const fn = await t.owner.query(
      `SELECT p.prosecdef,p.proconfig,
         ARRAY(SELECT a.grantee::regrole::text FROM aclexplode(p.proacl) a
               WHERE a.privilege_type='EXECUTE' AND a.grantee<>p.proowner) AS executors
       FROM pg_proc p WHERE p.oid='public.finalize_family_deletion(uuid)'::regprocedure`,
    );
    expect(fn.rows).toEqual([
      { prosecdef: true, proconfig: ['search_path=pg_catalog, pg_temp'], executors: [FAMILY_DELETION_ROLE] },
    ]);
  });

  it('TC-869 phá thử: bỏ điều kiện đến hạn khỏi policy thì nhà chưa đến hạn lộ ra; khôi phục thì kín lại', async () => {
    const c = await seedFamilyDeletionCase(t.owner, 'not_due');
    const assertSealed = () =>
      asFamilyDeletionRole(t.app, c.family, async () => {
        expect((await t.app.query('SELECT id FROM health_profiles')).rows).toEqual([]);
        expect((await t.app.query('DELETE FROM health_profiles')).rowCount).toBe(0);
      });
    const replace = (table: string, using: string, check: string | null) =>
      t.owner.query(`DROP POLICY ${POLICY} ON public.${table};
        CREATE POLICY ${POLICY} ON public.${table} AS RESTRICTIVE FOR ALL TO ${FAMILY_DELETION_ROLE}
        USING (${using})${check ? ` WITH CHECK (${check})` : ''}`);
    const originals = await t.owner.query<{ tablename: string; qual: string; with_check: string | null }>(
      `SELECT tablename,qual,with_check FROM pg_policies
       WHERE policyname=$1 AND tablename IN ('health_profiles','family_deletion_requests')`,
      [POLICY],
    );
    expect(originals.rowCount).toBe(2);
    await assertSealed();
    try {
      // Hai lớp: policy bảng dữ liệu tự kiểm hạn, và subquery đọc yêu cầu qua policy của bảng yêu cầu.
      await replace(
        'health_profiles',
        `EXISTS (SELECT 1 FROM public.family_deletion_requests r
          WHERE r.family_id = health_profiles.family_id AND r.status = 'pending')`,
        null,
      );
      await replace('family_deletion_requests', `status = 'pending'`, `status = 'revoked'`);
      await expect(assertSealed()).rejects.toThrow(/to deeply equal/);
    } finally {
      for (const row of originals.rows) await replace(row.tablename, row.qual, row.with_check);
    }
    await assertSealed();
  });
});
