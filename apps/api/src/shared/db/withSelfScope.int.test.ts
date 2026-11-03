import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedFamilyOnlyRows, seedProfileRows } from '@src/shared/test/seedSelfScopeRows.js';
import { seedTwoFamilies, type TwoFamilies } from '@src/shared/test/seedTwoFamilies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createDatabase, type Database } from './createDatabase.js';
import { runMigrations } from './runMigrations.js';
import { healthProfiles, measurements } from './schema/index.js';
import { withFamilyScope } from './withFamilyScope.js';
import { withSelfScope } from './withSelfScope.js';

const FAMILY_ONLY_TABLES = [
  'extraction_reservations',
  'extractions',
  'family_extraction_spend',
  'family_scan_quotas',
  'object_purges',
  'ocr_operations',
  'push_subscriptions',
  'reminder_deliveries',
  'scan_quota_audit',
];
const SELF_FILTERED: Array<[table: string, column: string]> = [
  ['health_profiles', 'id'],
  ['measurements', 'health_profile_id'],
  ['prescriptions', 'health_profile_id'],
  ['consent_invitations', 'profile_id'],
  ['profile_link_invitations', 'profile_id'],
  ['profile_link_events', 'profile_id'],
];
const PRESCRIPTION_ITEM_PROFILES = `SELECT p.health_profile_id AS profile
  FROM prescription_items i JOIN prescriptions p ON p.id = i.prescription_id`;

// Mọi truy vấn chạy bằng role app NOBYPASSRLS như runtime thật (Tech Spec §3.9.3).
describe('withSelfScope và RLS tự xem trên role app', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let owner: pg.Client;
  let database: Database;
  let seed: TwoFamilies;
  let mother: string;
  let father: string;

  const selfScope = <T>(work: Parameters<typeof withSelfScope<T>>[2]) =>
    withSelfScope(database, { familyId: seed.familyA, profileId: mother }, work);
  const count = (tx: Parameters<Parameters<typeof selfScope>[0]>[0], table: string) =>
    tx.execute<{ total: number }>(sql.raw(`SELECT count(*)::int AS total FROM ${table}`));

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    seed = await seedTwoFamilies(db.ownerUrl);
    [mother = '', father = ''] = seed.profilesA;
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await seedFamilyOnlyRows(owner, seed.familyA, mother);
    await seedProfileRows(owner, seed.familyA, mother);
    await seedProfileRows(owner, seed.familyA, father);
    await seedProfileRows(owner, seed.familyB, seed.profilesB[0] ?? '');
    // 1 kết nối để chứng minh biến phạm vi không rò sang transaction kế tiếp.
    pool = new pg.Pool({ connectionString: db.appUrl, max: 1 });
    database = createDatabase(pool);
  });

  afterAll(async () => {
    await pool?.end();
    await owner?.end();
    await db?.container.stop();
  });

  it.each(SELF_FILTERED)('TC-566 (tầng DB): %s chỉ trả dòng của hồ sơ phiên', async (table, column) => {
    const { rows } = await selfScope((tx) =>
      tx.execute<{ profile: string }>(sql.raw(`SELECT DISTINCT ${column} AS profile FROM ${table}`)),
    );
    expect(rows).toEqual([{ profile: mother }]);
  });

  it('TC-566 (tầng DB): prescription_items chỉ trả dòng của đơn thuộc hồ sơ phiên', async () => {
    const { rows } = await selfScope((tx) =>
      tx.execute<{ profile: string }>(
        sql.raw(`SELECT DISTINCT profile FROM (${PRESCRIPTION_ITEM_PROFILES}) x`),
      ),
    );
    expect(rows).toEqual([{ profile: mother }]);
    const { rows: unjoined } = await selfScope((tx) => count(tx, 'prescription_items'));
    expect(unjoined).toEqual([{ total: 1 }]);
  });

  it('TC-566 (tầng DB): hồ sơ của gia đình khác không đọc được dù đặt đúng profileId', async () => {
    const rows = await withSelfScope(
      database,
      { familyId: seed.familyA, profileId: seed.profilesB[0] ?? '' },
      (tx) => tx.select().from(healthProfiles),
    );
    expect(rows).toEqual([]);
  });

  it.each(FAMILY_ONLY_TABLES)(
    'TC-568: %s fail closed ở phạm vi tự xem, vẫn có dòng với main',
    async (table) => {
      const { rows: self } = await selfScope((tx) => count(tx, table));
      expect(self).toEqual([{ total: 0 }]);
      const { rows: main } = await withFamilyScope(database, seed.familyA, (tx) => count(tx, table));
      expect(main[0]?.total).toBeGreaterThan(0);
    },
  );

  it('TC-569: withFamilyScope vẫn thấy mọi hồ sơ và mọi dòng con của gia đình', async () => {
    const rows = await withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    expect(rows).toHaveLength(3);
    const { rows: items } = await withFamilyScope(database, seed.familyA, (tx) =>
      count(tx, 'prescription_items'),
    );
    expect(items).toEqual([{ total: 2 }]);
  });

  it('phạm vi tự xem không rò sang withFamilyScope kế tiếp trên cùng kết nối', async () => {
    await selfScope((tx) => tx.select().from(healthProfiles));
    const rows = await withFamilyScope(database, seed.familyA, (tx) => tx.select().from(healthProfiles));
    expect(rows).toHaveLength(3);
  });

  it('không ghi được dòng của hồ sơ khác trong phạm vi tự xem', async () => {
    await expect(
      selfScope((tx) =>
        tx.insert(measurements).values({
          familyId: seed.familyA,
          healthProfileId: father,
          kind: 'blood_pressure',
          measuredOn: '2026-10-03',
          systolic: 120,
          diastolic: 80,
          manualWithoutSource: true,
        }),
      ),
    ).rejects.toMatchObject({ cause: { message: expect.stringMatching(/row-level security/) } });
  });

  it.each(['', 'không-phải-uuid'])(
    'từ chối profileId "%s" trước khi chạm DB (rỗng sẽ mở rộng phạm vi)',
    async (id) => {
      await expect(
        withSelfScope(database, { familyId: seed.familyA, profileId: id }, (tx) => tx.execute(sql`SELECT 1`)),
      ).rejects.toThrow(/profileId/);
    },
  );

  it('từ chối familyId không phải UUID', async () => {
    await expect(
      withSelfScope(database, { familyId: '', profileId: randomUUID() }, (tx) => tx.execute(sql`SELECT 1`)),
    ).rejects.toThrow(/familyId/);
  });

  describe('TC-567 (tầng DB): phá thử từng lớp', () => {
    const profilesOf = (rows: { healthProfileId: string }[]) => [
      ...new Set(rows.map((r) => r.healthProfileId)),
    ];
    const readFiltered = () =>
      selfScope((tx) => tx.select().from(measurements).where(eq(measurements.healthProfileId, mother)));
    const readUnfiltered = () => selfScope((tx) => tx.select().from(measurements));
    const withoutSelfPolicy = async (check: () => Promise<void>) => {
      const original = await owner.query<{ qual: string }>(
        `SELECT qual FROM pg_policies WHERE tablename = 'measurements' AND policyname = 'family_isolation_policy'`,
      );
      await owner.query(
        `ALTER POLICY family_isolation_policy ON measurements
           USING (family_id = NULLIF(current_setting('app.family_id', true), '')::uuid)`,
      );
      try {
        await check();
      } finally {
        await owner.query(
          `ALTER POLICY family_isolation_policy ON measurements USING (${original.rows[0]?.qual})`,
        );
      }
    };

    it('bỏ lọc ở application: RLS vẫn chặn hồ sơ khác', async () => {
      expect(profilesOf(await readUnfiltered())).toEqual([mother]);
    });

    it('tắt điều kiện tự xem trong policy: lọc ở application vẫn chỉ trả hồ sơ phiên', async () => {
      await withoutSelfPolicy(async () => {
        expect(profilesOf(await readFiltered())).toEqual([mother]);
      });
    });

    it('gỡ cả hai lớp: lộ hồ sơ khác cùng gia đình (chứng minh test phát hiện được)', async () => {
      await withoutSelfPolicy(async () => {
        expect(profilesOf(await readUnfiltered()).sort()).toEqual([mother, father].sort());
      });
      expect(profilesOf(await readUnfiltered())).toEqual([mother]);
    });
  });
});
