import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedTwoFamilies, type TwoFamilies } from '@src/shared/test/seedTwoFamilies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createDatabase, type Database } from './createDatabase.js';
import { runMigrations } from './runMigrations.js';
import { healthProfiles } from './schema/index.js';
import { withFamilyScope } from './withFamilyScope.js';

const RLS_TABLES = ['health_profiles', 'upload_batches', 'source_documents', 'extractions', 'measurements'];

// Mọi truy vấn chạy bằng role app NOBYPASSRLS như runtime thật (Tech Spec §3.2).
describe('withFamilyScope và RLS trên role app', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let database: Database;
  let seed: TwoFamilies;

  const countUnscoped = async (table: string) => {
    const { rows } = await pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM ${table}`);
    return rows[0]?.total;
  };

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    seed = await seedTwoFamilies(db.ownerUrl);
    // 1 kết nối để chứng minh SET LOCAL không rò sang truy vấn kế tiếp trên cùng kết nối.
    pool = new pg.Pool({ connectionString: db.appUrl, max: 1 });
    database = createDatabase(pool);
  });

  afterAll(async () => {
    await pool?.end();
    await db?.container.stop();
  });

  it.each(RLS_TABLES)('TC-075: truy vấn %s không gán app.family_id trả về 0 dòng', async (table) => {
    expect(await countUnscoped(table)).toBe(0);
  });

  it('SPEC-006: main nhóm A chỉ thấy đúng 3 hồ sơ của nhóm mình', async () => {
    const rows = await withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    expect(rows.map((row) => row.id).sort()).toEqual([...seed.profilesA].sort());
  });

  it('TC-076 (tầng DB): hồ sơ nhóm khác và ID không tồn tại đều không trả về dòng nào', async () => {
    const findProfile = (id: string) =>
      withFamilyScope(database, seed.familyA, (tx) =>
        tx.select().from(healthProfiles).where(eq(healthProfiles.id, id)),
      );
    expect(await findProfile(seed.profilesB[0] ?? '')).toEqual([]);
    expect(await findProfile(randomUUID())).toEqual([]);
  });

  it('không ghi được dòng mang family_id của nhóm khác', async () => {
    await expect(
      withFamilyScope(database, seed.familyA, (tx) =>
        tx.insert(healthProfiles).values({ familyId: seed.familyB, displayName: 'Lén' }),
      ),
    ).rejects.toMatchObject({ cause: { message: expect.stringMatching(/row-level security/) } });
  });

  it('không sửa, không xóa được dòng của nhóm khác', async () => {
    const targetId = seed.profilesB[0] ?? '';
    const result = await withFamilyScope(database, seed.familyA, async (tx) => ({
      updated: await tx
        .update(healthProfiles)
        .set({ displayName: 'Bị sửa' })
        .where(eq(healthProfiles.id, targetId))
        .returning(),
      deleted: await tx.delete(healthProfiles).where(eq(healthProfiles.id, targetId)).returning(),
    }));
    expect(result).toEqual({ updated: [], deleted: [] });
  });

  it('phạm vi chỉ sống trong transaction: truy vấn kế tiếp trên cùng kết nối lại thấy 0 dòng', async () => {
    await withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    expect(await countUnscoped('health_profiles')).toBe(0);
  });

  it('lỗi trong work thì rollback toàn bộ thao tác ghi', async () => {
    await expect(
      withFamilyScope(database, seed.familyA, async (tx) => {
        await tx.insert(healthProfiles).values({ familyId: seed.familyA, displayName: 'Tạm' });
        throw new Error('hủy');
      }),
    ).rejects.toThrow('hủy');
    const rows = await withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    expect(rows).toHaveLength(3);
  });

  it('từ chối familyId không phải UUID trước khi chạm DB', async () => {
    await expect(withFamilyScope(database, '', (tx) => tx.execute(sql`SELECT 1`))).rejects.toThrow(
      /familyId/,
    );
  });

  // Chạy cuối: phá RLS để chứng minh các test trên báo đỏ khi mất lớp bảo vệ (DoD E2-S2-T2).
  const breakAsOwner = async (breakSql: string, restoreSql: string, check: () => Promise<void>) => {
    const owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    try {
      await owner.query(breakSql);
      await check();
    } finally {
      await owner.query(restoreSql);
      await owner.end();
    }
  };

  it('phá thử: tắt RLS thì truy vấn không phạm vi lộ cả 2 nhóm (TC-075 báo đỏ)', async () => {
    await breakAsOwner(
      'ALTER TABLE health_profiles DISABLE ROW LEVEL SECURITY',
      'ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY',
      async () => expect(await countUnscoped('health_profiles')).toBe(7),
    );
    expect(await countUnscoped('health_profiles')).toBe(0);
  });

  it('phá thử: gỡ family_isolation_policy thì nhóm A mất quyền đọc hồ sơ của mình (SPEC-006 báo đỏ)', async () => {
    const readA = () => withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    await breakAsOwner(
      'DROP POLICY family_isolation_policy ON health_profiles',
      `CREATE POLICY family_isolation_policy ON health_profiles AS PERMISSIVE FOR ALL TO public
         USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid)`,
      async () => expect(await readA()).toEqual([]),
    );
    expect(await readA()).toHaveLength(3);
  });
});
