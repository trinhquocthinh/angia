import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '../db/createDatabase.js';
import { runMigrations } from '../db/runMigrations.js';
import { withSelfScope } from '../db/withSelfScope.js';
import { HEALTH_DATA_ROUTES, type RouteOfKind } from './healthDataRoutes.js';
import { expectSelfWriteDenied } from './expectSelfWriteDenied.js';
import { seedTwoFamilies, type TwoFamilies } from './seedTwoFamilies.js';
import { snapshotHealthTables } from './snapshotHealthTables.js';
import { startTestDatabase, type TestDatabase } from './startTestDatabase.js';

// TC-704/705 được chạy lại với migration phá policy trong bản sao tạm; không có công tắc phá ở runtime.
// TC-705/706 tại E19 chỉ chứng minh tầng DB; PATCH/use case thật được nối vào E20.
describe('Phá thử quyền ghi tự quản trước khi mở route E20', () => {
  let db: TestDatabase;
  let pool: pg.Pool;
  let database: Database;
  let owner: pg.Client;
  let seed: TwoFamilies;
  const ownEntry = randomUUID();
  const fatherEntry = randomUUID();
  const foreignEntry = randomUUID();
  const prescriptionId = randomUUID();
  const self = <T>(work: Parameters<typeof withSelfScope<T>>[2]) =>
    withSelfScope(database, { familyId: seed.familyA, profileId: seed.profilesA[0]! }, work);

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    seed = await seedTwoFamilies(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    for (const [familyId, profileId, entryId] of [
      [seed.familyA, seed.profilesA[0]!, ownEntry],
      [seed.familyA, seed.profilesA[1]!, fatherEntry],
      [seed.familyB, seed.profilesB[0]!, foreignEntry],
    ]) {
      const issueId = randomUUID();
      await owner.query(
        `INSERT INTO pain_issues(id,family_id,health_profile_id,region,side,status)
        VALUES($1,$2,$3,'knee','left','tracking')`,
        [issueId, familyId, profileId],
      );
      await owner.query(
        `INSERT INTO pain_entries(id,family_id,health_profile_id,pain_issue_id,level,recorded_at)
        VALUES($1,$2,$3,$4,5,'2026-11-06T01:00:00Z')`,
        [entryId, familyId, profileId, issueId],
      );
      await owner.query(
        `INSERT INTO exercise_notes(id,family_id,health_profile_id,pain_issue_id,name,source,start_date)
        VALUES($1,$2,$3,$4,'Bài tập','self','2026-11-06')`,
        [randomUUID(), familyId, profileId, issueId],
      );
      await owner.query(
        `INSERT INTO pain_issue_status_events(id,family_id,health_profile_id,pain_issue_id,kind,on_date)
        VALUES($1,$2,$3,$4,'reopened','2026-11-06')`,
        [randomUUID(), familyId, profileId, issueId],
      );
    }
    await owner.query(
      `INSERT INTO prescriptions(id,family_id,health_profile_id,issued_date,manual_without_source)
      VALUES($1,$2,$3,'2026-11-06',true)`,
      [prescriptionId, seed.familyA, seed.profilesA[0]!],
    );
    pool = new pg.Pool({ connectionString: db.appUrl, max: 1 });
    database = createDatabase(pool);
  });
  afterAll(async () => {
    await pool?.end();
    await owner?.end();
    await db?.container.stop();
  });

  it('TC-704–706: probe chạy bằng role app NOBYPASSRLS, không phải owner', async () => {
    const { rows } = await self((tx) =>
      tx.execute(sql`SELECT current_user AS role, rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname = current_user`),
    );
    expect(rows).toEqual([{ role: 'angia_test_app', rolsuper: false, rolbypassrls: false }]);
  });

  it('TC-704: chặn INSERT đơn thuốc của chính hồ sơ phiên bằng RLS', async () => {
    const before = await snapshotHealthTables(owner);
    await expect(
      self((tx) =>
        tx.execute(sql`INSERT INTO prescriptions
      (id,family_id,health_profile_id,issued_date,manual_without_source)
      VALUES(${randomUUID()},${seed.familyA},${seed.profilesA[0]!},'2026-11-06',true)`),
      ),
    ).rejects.toMatchObject({
      cause: { code: '42501', message: expect.stringMatching(/row-level security/) },
    });
    expect(await snapshotHealthTables(owner)).toEqual(before);
  });

  it.each(['UPDATE', 'DELETE'] as const)(
    'TC-704: chặn %s đơn thuốc của chính hồ sơ phiên',
    async (method) => {
      const before = await snapshotHealthTables(owner);
      await self(async (tx) => {
        const query =
          method === 'UPDATE'
            ? sql`UPDATE prescriptions SET facility='Không được ghi' WHERE id=${prescriptionId} RETURNING id`
            : sql`DELETE FROM prescriptions WHERE id=${prescriptionId} RETURNING id`;
        expect((await tx.execute(query)).rows).toEqual([]);
      });
      expect(await snapshotHealthTables(owner)).toEqual(before);
    },
  );

  it('TC-705: chặn sửa lần ghi của Bố khi chỉ lọc ID, không lọc hồ sơ', async () => {
    const before = await snapshotHealthTables(owner);
    await self(async (tx) => {
      expect(
        (await tx.execute(sql`UPDATE pain_entries SET level=9 WHERE id=${fatherEntry} RETURNING id`)).rows,
      ).toEqual([]);
    });
    expect(await snapshotHealthTables(owner)).toEqual(before);
  });

  it.each(['UPDATE', 'DELETE'] as const)(
    'TC-706: RLS chặn %s bỏ lọc hồ sơ cho cả hai đích',
    async (method) => {
      const before = await snapshotHealthTables(owner);
      for (const id of [fatherEntry, foreignEntry]) {
        await self(async (tx) => {
          const query =
            method === 'UPDATE'
              ? sql`UPDATE pain_entries SET level=9 WHERE id=${id} RETURNING id`
              : sql`DELETE FROM pain_entries WHERE id=${id} RETURNING id`;
          expect((await tx.execute(query)).rows).toEqual([]);
        });
      }
      expect(await snapshotHealthTables(owner)).toEqual(before);
    },
  );

  it('TC-706 đối chứng: đúng hồ sơ vẫn INSERT/UPDATE/DELETE được', async () => {
    await self(async (tx) => {
      const { rows } = await tx.execute<{ pain_issue_id: string }>(
        sql`SELECT pain_issue_id FROM pain_entries WHERE id=${ownEntry}`,
      );
      const id = randomUUID();
      expect(
        (
          await tx.execute(sql`INSERT INTO pain_entries
        (id,family_id,health_profile_id,pain_issue_id,level,recorded_at)
        VALUES(${id},${seed.familyA},${seed.profilesA[0]!},${rows[0]!.pain_issue_id},5,now()) RETURNING id`)
        ).rows,
      ).toEqual([{ id }]);
      expect(
        (await tx.execute(sql`UPDATE pain_entries SET level=6 WHERE id=${id} RETURNING level`)).rows,
      ).toEqual([{ level: 6 }]);
      expect((await tx.execute(sql`DELETE FROM pain_entries WHERE id=${id} RETURNING id`)).rows).toEqual([
        { id },
      ]);
    });
  });

  it.each(['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events'])(
    'TC-698/699: snapshot phát hiện thay đổi thật ở %s',
    async (table) => {
      const before = await snapshotHealthTables(owner);
      await owner.query('BEGIN');
      try {
        await owner.query(`UPDATE ${table} SET created_at=created_at + interval '1 second'`);
        expect(await snapshotHealthTables(owner)).not.toEqual(before);
      } finally {
        await owner.query('ROLLBACK');
      }
      expect(await snapshotHealthTables(owner)).toEqual(before);
    },
  );

  it('TC-709: khung probe bắt buộc khai báo đủ route self_write khi E20 đăng ký', async () => {
    // E19 chưa có route: Record sẽ báo lỗi typecheck ngay khi E20 thêm route mà chưa có probe.
    const probes: Record<RouteOfKind<'self_write'>, Parameters<typeof expectSelfWriteDenied>[1]> = {};
    expect(Object.keys(probes).sort()).toEqual(
      Object.entries(HEALTH_DATA_ROUTES)
        .filter(([, kind]: [string, string]) => kind === 'self_write')
        .map(([route]) => route)
        .sort(),
    );
    for (const route of Object.keys(probes) as RouteOfKind<'self_write'>[]) {
      await expectSelfWriteDenied(route, probes[route]);
    }
  });
});
