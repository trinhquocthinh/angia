import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SELF_READ_ONLY_TABLES } from '@src/shared/test/expectedRlsPolicies.js';
import { seedSelfReadOnlyRows } from '@src/shared/test/seedSelfReadOnlyRows.js';
import { seedTwoFamilies } from '@src/shared/test/seedTwoFamilies.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createDatabase, type Database } from './createDatabase.js';
import { runMigrations } from './runMigrations.js';
import { type FamilyScopedTx, withFamilyScope } from './withFamilyScope.js';
import { withSelfScope } from './withSelfScope.js';

const FAMILY_ONLY_TABLES = new Set([
  'extraction_reservations',
  'extractions',
  'family_extraction_spend',
  'family_scan_quotas',
  'object_purges',
  'ocr_operations',
  'push_subscriptions',
  'reminder_deliveries',
  'scan_quota_audit',
]);
const ROLLBACK = new Error('Hoàn tác dữ liệu thử');

describe('Quyền ghi tự xem trên mọi bảng self_read_only', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let database: Database;
  let familyId: string;
  let profileId: string;
  const fixtures = new Map<string, string>();
  const self = <T>(work: (tx: FamilyScopedTx) => Promise<T>) =>
    withSelfScope(database, { familyId, profileId }, work);
  const snapshot = (tx: FamilyScopedTx, table: string) =>
    tx.execute(sql.raw(`SELECT to_jsonb(t) AS row FROM public.${table} t ORDER BY to_jsonb(t)::text`));
  const matching = (table: string) => sql`to_jsonb(t) = ${fixtures.get(table)!}::jsonb`;
  const insert = (tx: FamilyScopedTx, table: string, row = fixtures.get(table)!) =>
    tx.execute(sql`INSERT INTO ${sql.raw(`public.${table}`)}
      SELECT * FROM json_populate_record(NULL::${sql.raw(`public.${table}`)}, ${row}::json)
      RETURNING *`);

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    const seed = await seedTwoFamilies(db.ownerUrl);
    familyId = seed.familyA;
    profileId = seed.profilesA[0]!;
    const owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    try {
      await seedSelfReadOnlyRows(owner, familyId, profileId);
      for (const table of SELF_READ_ONLY_TABLES) {
        const column =
          table === 'health_profiles'
            ? 'id'
            : [
                  'consent_invitations',
                  'consent_legacy_attestations',
                  'profile_link_events',
                  'profile_link_invitations',
                ].includes(table)
              ? 'profile_id'
              : 'health_profile_id';
        const filter = FAMILY_ONLY_TABLES.has(table)
          ? ''
          : table === 'prescription_items'
            ? 'AND prescription_id IN (SELECT id FROM prescriptions WHERE health_profile_id=$2)'
            : `AND ${column}=$2`;
        const { rows } = await owner.query<{ row: string }>(
          `SELECT row_to_json(t)::text AS row FROM public.${table} t WHERE family_id=$1 ${filter} LIMIT 1`,
          FAMILY_ONLY_TABLES.has(table) ? [familyId] : [familyId, profileId],
        );
        expect(rows, `Fixture ${table} phải có dòng hợp lệ`).toHaveLength(1);
        fixtures.set(table, rows[0]!.row);
      }
    } finally {
      await owner.end();
    }
    pool = new pg.Pool({ connectionString: db.appUrl, max: 1 });
    database = createDatabase(pool);
  });
  afterAll(async () => {
    await pool?.end();
    await db?.container.stop();
  });

  it.each(SELF_READ_ONLY_TABLES)(
    'TC-707: %s chặn INSERT bằng RLS, không chấp nhận lỗi UNIQUE/FK',
    async (table) => {
      // RLS phải chạy trước UNIQUE; TC-710 chứng minh cùng payload INSERT được khi dòng cũ đã xóa.
      await expect(self((tx) => insert(tx, table))).rejects.toMatchObject({
        cause: { code: '42501', message: expect.stringMatching(/row-level security/) },
      });
    },
  );

  it.each(SELF_READ_ONLY_TABLES)(
    'TC-707: %s chặn UPDATE/DELETE, giữ nguyên dữ liệu và quyền SELECT',
    async (table) => {
      const before = await withFamilyScope(database, familyId, (tx) => snapshot(tx, table));
      await self(async (tx) => {
        const read = await snapshot(tx, table);
        if (FAMILY_ONLY_TABLES.has(table)) expect(read.rows).toEqual([]);
        else expect(read.rows).toContainEqual({ row: JSON.parse(fixtures.get(table)!) });
        expect(
          (
            await tx.execute(
              sql`UPDATE ${sql.raw(`public.${table}`)} t SET family_id=family_id WHERE ${matching(table)} RETURNING *`,
            )
          ).rows,
        ).toEqual([]);
        expect(
          (
            await tx.execute(
              sql`DELETE FROM ${sql.raw(`public.${table}`)} t WHERE ${matching(table)} RETURNING *`,
            )
          ).rows,
        ).toEqual([]);
        expect((await snapshot(tx, table)).rows).toEqual(read.rows);
      });
      expect((await withFamilyScope(database, familyId, (tx) => snapshot(tx, table))).rows).toEqual(
        before.rows,
      );
    },
  );

  it.each(SELF_READ_ONLY_TABLES.filter((table) => table !== 'scan_quota_audit'))(
    'TC-710: %s vẫn UPDATE/DELETE/INSERT được trong phạm vi gia đình',
    async (table) => {
      // Cùng pool max=1 sau selfScope: biến phiên phải trở về rỗng; luôn rollback cả cascade.
      await self((tx) => snapshot(tx, table));
      await expect(
        withFamilyScope(database, familyId, async (tx) => {
          expect(
            (
              await tx.execute(
                sql`UPDATE ${sql.raw(`public.${table}`)} t SET family_id=family_id WHERE ${matching(table)} RETURNING *`,
              )
            ).rows,
          ).toHaveLength(1);
          expect(
            (
              await tx.execute(
                sql`DELETE FROM ${sql.raw(`public.${table}`)} t WHERE ${matching(table)} RETURNING *`,
              )
            ).rows,
          ).toHaveLength(1);
          expect((await insert(tx, table)).rows).toHaveLength(1);
          throw ROLLBACK;
        }),
      ).rejects.toBe(ROLLBACK);
    },
  );
  it('TC-710: scan_quota_audit giữ quyền INSERT và trigger chỉ ghi thêm của v0.2', async () => {
    await expect(
      withFamilyScope(database, familyId, async (tx) => {
        const row = JSON.stringify({ ...JSON.parse(fixtures.get('scan_quota_audit')!), id: randomUUID() });
        expect((await insert(tx, 'scan_quota_audit', row)).rows).toHaveLength(1);
        throw ROLLBACK;
      }),
    ).rejects.toBe(ROLLBACK);
    for (const query of ['UPDATE scan_quota_audit SET family_id=family_id', 'DELETE FROM scan_quota_audit']) {
      await expect(
        withFamilyScope(database, familyId, (tx) => tx.execute(sql.raw(query))),
      ).rejects.toMatchObject({ cause: { code: '55000', message: 'Scan quota audit is append only' } });
    }
  });
});
