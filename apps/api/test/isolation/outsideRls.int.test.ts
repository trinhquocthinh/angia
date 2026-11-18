import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('../../../../scripts/ops/rlsInventory.ts', import.meta.url));

interface Inventory {
  format: string;
  context: { read_only: string }[];
  roles: { name: string; superuser: boolean; bypass_rls: boolean }[];
  relations: { schema: string; name: string; rls: boolean }[];
  policies: { schema: string; relation: string }[];
}

describe('E27-S1-T2: kiểm kê quyền và theo dõi đường ngoài RLS', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  let app: pg.Client;

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    app = new pg.Client({ connectionString: db.appUrl });
    await owner.connect();
    await app.connect();
  });

  afterAll(async () => {
    try {
      await app?.end();
    } finally {
      try {
        await owner?.end();
      } finally {
        await db?.container.stop();
      }
    }
  });

  const inventory = async (): Promise<Inventory> => {
    const { stdout } = await execute(process.execPath, ['--import', 'tsx', script], {
      env: { ...process.env, DATABASE_OWNER_URL: db.ownerUrl },
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Inventory;
  };

  it('role runtime thực tế không phải superuser và không BYPASSRLS', async () => {
    const result = await app.query(`
      SELECT rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname = current_user
    `);
    expect(result.rows).toEqual([{ rolsuper: false, rolbypassrls: false }]);
  });

  it('CLI xuất JSON từ transaction chỉ đọc và kiểm kê RLS hiện có', async () => {
    const report = await inventory();
    expect(report.format).toBe('angia-rls-inventory/1');
    expect(report.context).toEqual([expect.objectContaining({ read_only: 'on' })]);
    expect(report.roles).toContainEqual(
      expect.objectContaining({
        name: 'angia_test_app',
        superuser: false,
        bypass_rls: false,
      }),
    );
    expect(report.relations).toContainEqual(
      expect.objectContaining({
        schema: 'public',
        name: 'health_profiles',
        rls: true,
      }),
    );
    expect(report.policies).toContainEqual(
      expect.objectContaining({
        schema: 'public',
        relation: 'health_profiles',
      }),
    );
  });

  it('kiểm kê phản ánh việc nới BYPASSRLS và trạng thái sau khôi phục', async () => {
    const assertRuntimeRole = async () => {
      const report = await inventory();
      expect(report.roles.find(({ name }) => name === 'angia_test_app')).toMatchObject({
        superuser: false,
        bypass_rls: false,
      });
    };

    await assertRuntimeRole();
    try {
      await owner.query('ALTER ROLE angia_test_app BYPASSRLS');
      await expect(assertRuntimeRole()).rejects.toThrow();
    } finally {
      await owner.query('ALTER ROLE angia_test_app NOBYPASSRLS');
    }
    await assertRuntimeRole();
  });

  // Chuyển thành test thực thi khi đường tương ứng được triển khai.
  // TODO không phải bằng chứng TC đạt và không thay phép phá thử quyền tối thiểu.
  it('TC-868: found_family chỉ trả id; cấp SELECT toàn bảng làm cùng assertion đỏ', async () => {
    const actor = randomUUID();
    const recipient = randomUUID();
    const tokenHash = createHash('sha256').update(randomUUID()).digest('hex');
    const invitation = randomUUID();
    await owner.query(
      `INSERT INTO accounts(id,display_name,is_system_admin) VALUES($1,'Quản trị',true),($2,'Người nhận',false)`,
      [actor, recipient],
    );
    await owner.query(
      `INSERT INTO family_invitations(id,kind,token_hash,code_hash,created_by,expires_at)
      VALUES($1,'found_family',$2,$3,$4,now()+interval '7 days')`,
      [invitation, tokenHash, randomUUID(), actor],
    );
    const assertMinimum = async () => {
      expect(
        (
          await app.query(`SELECT has_table_privilege(current_user,'public.family_invitations','SELECT') AS table_read,
        has_column_privilege(current_user,'public.family_invitations','token_hash','SELECT') AS token_read,
        has_column_privilege(current_user,'public.family_invitations','code_hash','SELECT') AS code_read`)
        ).rows,
      ).toEqual([{ table_read: false, token_read: false, code_read: false }]);
      expect(
        (await app.query('SELECT * FROM public.lookup_founding_invitation($1)', [tokenHash])).rows,
      ).toEqual([{ id: invitation }]);
      await expect(app.query('SELECT * FROM public.family_invitations')).rejects.toMatchObject({
        code: '42501',
      });
    };
    await assertMinimum();
    try {
      await owner.query('GRANT SELECT ON public.family_invitations TO angia_test_app');
      await expect(assertMinimum()).rejects.toThrow();
    } finally {
      await owner.query('REVOKE SELECT ON public.family_invitations FROM angia_test_app');
    }
    await assertMinimum();
    expect(
      (await app.query('SELECT * FROM public.lookup_founding_invitation($1)', [randomUUID()])).rows,
    ).toEqual([]);
    await app.query('BEGIN');
    try {
      expect(
        (
          await app.query('SELECT public.accept_founding_invitation($1,$2) AS accepted', [
            tokenHash,
            recipient,
          ])
        ).rows,
      ).toEqual([{ accepted: true }]);
      expect(
        (await app.query('SELECT * FROM public.lookup_founding_invitation($1)', [tokenHash])).rows,
      ).toEqual([]);
    } finally {
      await app.query('ROLLBACK');
    }
    await assertMinimum();
    const functions = await owner.query(`SELECT p.proname,p.prosecdef,p.proconfig,
      NOT EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS no_public
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname IN ('lookup_founding_invitation','accept_founding_invitation')`);
    expect(functions.rows).toHaveLength(2);
    for (const row of functions.rows)
      expect(row).toMatchObject({
        prosecdef: true,
        proconfig: ['search_path=pg_catalog, pg_temp'],
        no_public: true,
      });
  });

  it('TC-868: join_family tra token/mã thật, quyền tối thiểu và phá thử SELECT', async () => {
    const actor = randomUUID();
    const family = randomUUID();
    const id = randomUUID();
    const tokenHash = createHash('sha256').update(randomUUID()).digest('hex');
    const codeHash = createHash('sha256').update(randomUUID()).digest('hex');
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà mời')", [family]);
    await owner.query(
      "INSERT INTO accounts(id,display_name,family_id,family_role) VALUES($1,'Người mời',$2,'main')",
      [actor, family],
    );
    await owner.query(
      `INSERT INTO family_invitations(id,kind,family_id,role,token_hash,code_hash,created_by,expires_at)
      VALUES($1,'join_family',$2,'member',$3,$4,$5,now()+interval '7 days')`,
      [id, family, tokenHash, codeHash, actor],
    );
    const lookup = (hash: string) => app.query('SELECT * FROM public.lookup_join_invitation($1)', [hash]);
    const assertMinimum = async () => {
      expect(
        (
          await app.query(`SELECT
        has_table_privilege(current_user,'public.family_invitations','SELECT') AS table_read,
        has_column_privilege(current_user,'public.family_invitations','token_hash','SELECT') AS token_read,
        has_column_privilege(current_user,'public.family_invitations','code_hash','SELECT') AS code_read`)
        ).rows,
      ).toEqual([{ table_read: false, token_read: false, code_read: false }]);
      for (const hash of [tokenHash, codeHash]) {
        expect((await lookup(hash)).rows).toEqual([
          { id, family_id: family, role: 'member', status: 'pending' },
        ]);
      }
      await expect(app.query('SELECT * FROM public.family_invitations')).rejects.toMatchObject({
        code: '42501',
      });
    };
    await assertMinimum();
    try {
      await owner.query('GRANT SELECT ON public.family_invitations TO angia_test_app');
      await expect(assertMinimum()).rejects.toThrow();
    } finally {
      await owner.query('REVOKE SELECT ON public.family_invitations FROM angia_test_app');
    }
    await assertMinimum();
    expect((await lookup(randomUUID())).rows).toEqual([]);
    const changes = [
      'revoked_at=now()',
      'accepted_at=now(),accepted_by=created_by',
      "created_at=now()-interval '8 days',expires_at=now()-interval '1 day'",
      "kind='found_family',family_id=NULL,role=NULL",
    ];
    for (const change of changes) {
      await owner.query(`UPDATE family_invitations SET ${change} WHERE id=$1`, [id]);
      expect((await lookup(tokenHash)).rows).toEqual([]);
      expect((await lookup(codeHash)).rows).toEqual([]);
      await owner.query(
        `UPDATE family_invitations SET kind='join_family',family_id=$2,role='member',
        revoked_at=NULL,accepted_at=NULL,accepted_by=NULL,created_at=now(),expires_at=now()+interval '7 days' WHERE id=$1`,
        [id, family],
      );
    }
    await assertMinimum();
    const result = await owner.query(`SELECT p.prosecdef,p.proconfig,
      NOT EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS no_public
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='lookup_join_invitation'`);
    expect(result.rows).toEqual([
      { prosecdef: true, proconfig: ['search_path=pg_catalog, pg_temp'], no_public: true },
    ]);
  });
  it.todo(
    'TC-869: E28-S2-T2 — chỉ đọc/xoá nhà có yêu cầu pending đến hạn; bỏ điều kiện làm cùng assertion đỏ',
  );
  it.todo(
    'TC-870: E29-S3-T1/T2 — chỉ đọc đúng hồ sơ trong cửa sổ; mở hồ sơ hoặc bỏ hạn làm cùng assertion đỏ',
  );
});
