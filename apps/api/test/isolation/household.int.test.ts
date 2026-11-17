import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHealthDataProbes } from '@src/shared/test/createHealthDataProbes.js';
import { seedIsolationHousehold } from '@src/shared/test/seedIsolationHousehold.js';
import { createIsolationTarget } from '@src/shared/test/createIsolationTarget.js';
import { HEALTH_DATA_ROUTES } from '@src/shared/test/healthDataRoutes.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedAccount, seedSession, type SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { Target } from '@src/shared/test/CrossFamilyTarget.js';
import { HOUSEHOLD_ROUTE_PLAN, HOUSEHOLD_RLS_TABLES } from '@src/shared/test/householdIsolationPlan.js';

const healthRoutes = Object.entries(HEALTH_DATA_ROUTES).map(([route, kind]) => ({ route, kind }));
const scopedRoutes = healthRoutes.filter(({ kind }) => kind === 'scoped');
const noFamilyRoutes = healthRoutes;
const profiles = '/api/health-profiles';

// Kiểm trạng thái mất quyền trước khi có API rời/gỡ E28; không nghiệm thu thao tác rời/gỡ.
// Mọi SQL thay đổi quyền/RLS bên dưới chỉ chạy trên PostgreSQL Testcontainers dùng một lần.
describe('E27-S1-T1: cô lập nhà, phiên cũ và tài khoản chưa có nhà', () => {
  let t: ProfileTestApp;
  let victim: Awaited<ReturnType<typeof seedIsolationHousehold>>;
  let target: Target;
  let foreignTarget: Target;
  let missing: Target;
  let foreign: SeededSession;
  let waiting: SeededSession;
  let detached: SeededSession;
  let rejoined: SeededSession;
  let otherFamily: string;

  beforeAll(async () => {
    t = await startProfileTestApp();
    victim = await seedIsolationHousehold(t);
    target = await createIsolationTarget(t, victim);
    otherFamily = await t.family();
    foreign = await t.session(otherFamily);
    waiting = await seedSession(t.owner, await seedAccount(t.owner));
    detached = await t.session(victim.familyId);
    rejoined = await t.session(victim.familyId);
    for (const user of [detached, rejoined]) {
      expect((await t.call(user, 'GET', `${profiles}/${victim.profile.id}/measurements`)).status).toBe(200);
    }
    await t.owner.query(
      'UPDATE accounts SET family_id = NULL, family_role = NULL, health_profile_id = NULL WHERE id = $1',
      [detached.accountId],
    );
    await t.owner.query(
      "UPDATE accounts SET family_id = $1, family_role = 'main', health_profile_id = NULL WHERE id = $2",
      [otherFamily, rejoined.accountId],
    );
    foreignTarget = {
      ...target,
      token: t.codec.issue({ ...t.codec.verify(target.token)!, familyId: otherFamily }),
    };
    missing = Object.fromEntries(
      Object.keys(target).map((key) => [key, key === 'token' ? 'bogus' : randomUUID()]),
    ) as unknown as Target;
    // Chứng minh cookie cũ vẫn hợp lệ nhưng quyền gia đình được đọc lại từ DB.
    for (const user of [waiting, detached]) {
      const response = await t.call(user, 'GET', '/api/me');
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ family: null, role: null });
    }
    const current = await t.call(rejoined, 'GET', '/api/me');
    expect(current.status).toBe(200);
    expect(await current.json()).toMatchObject({ family: { id: otherFamily }, role: 'main' });
  });

  afterAll(async () => {
    await t?.stop();
  });

  const probe = (user: SeededSession, row: (typeof healthRoutes)[number], ids: Target) => {
    if (row.kind === 'scoped') {
      return createHealthDataProbes(t)[row.route as keyof ReturnType<typeof createHealthDataProbes>](
        user,
        ids,
      );
    }
    const [method, pattern] = row.route.split(' ') as [string, string];
    const path = pattern.replace(
      /:([A-Za-z]+)/g,
      (_match, key: string) =>
        ({
          id: ids.profileId,
          issueId: ids.painIssueId,
          entryId: ids.painEntryId,
          exerciseId: ids.painExerciseId,
        })[key] ?? randomUUID(),
    );
    return t.call(user, method, path, method === 'GET' ? undefined : {});
  };

  it.each(scopedRoutes)('TC-867: nhà khác không đọc/ghi được $route', async (row) => {
    const before = await snapshotHealthTables(t.owner);
    await expectCrossFamilyDenied(
      () => probe(foreign, row, foreignTarget),
      () => probe(foreign, row, missing),
    );
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
  });

  it.each(scopedRoutes)(
    'TC-871: cookie cũ đã sang nhà mới không truy cập được $route của nhà cũ',
    async (row) => {
      const before = await snapshotHealthTables(t.owner);
      await expectCrossFamilyDenied(
        () => probe(rejoined, row, foreignTarget),
        () => probe(rejoined, row, missing),
      );
      expect(await snapshotHealthTables(t.owner)).toEqual(before);
    },
  );

  describe.each([
    { code: 'TC-871', state: 'đã mất quyền nhà cũ', actor: () => detached },
    { code: 'TC-872', state: 'chưa từng có nhà', actor: () => waiting },
  ])('$code: $state', ({ actor, code }) => {
    it.each(noFamilyRoutes)(`${code}: chặn $route và không ghi dữ liệu`, async (row) => {
      const before = await snapshotHealthTables(t.owner);
      const response = await probe(actor(), row, target);
      const link = row.route.includes(' /api/me/link-invitations/');
      expect(response.status).toBe(link ? 404 : 403);
      expect(await response.json()).toMatchObject({
        error: { code: link ? 'ERR_NOT_FOUND' : 'ERR_FORBIDDEN' },
      });
      expect(await snapshotHealthTables(t.owner)).toEqual(before);
    });
  });

  it('TC-867: cổng kiểm kê không cho route nhà mới xuất hiện khi chưa có probe', () => {
    const registered = new Set(t.app.routes.map(({ method, path }) => `${method} ${path}`));
    expect(HOUSEHOLD_ROUTE_PLAN.filter(({ route }) => registered.has(route))).toEqual([]);
  });

  it('TC-867: bảng nhà mới xuất hiện phải bổ sung fixture và phép phá RLS trước khi nghiệm thu', async () => {
    for (const table of HOUSEHOLD_RLS_TABLES) {
      const result = await t.owner.query('SELECT to_regclass($1) AS name', [`public.${table}`]);
      expect(result.rows[0]?.name, `${table}: cần thêm fixture và probe RLS thật`).toBeNull();
    }
  });

  it('TC-867: cùng phép kiểm tra cô lập phát hiện tắt RLS, khôi phục rồi lại xanh', async () => {
    const assertIsolated = async () => {
      const result = await withFamilyScope(t.database, otherFamily, (tx) =>
        tx.execute<{ id: string }>(sql`SELECT id FROM health_profiles`),
      );
      expect(result.rows.some(({ id }) => id === victim.profile.id)).toBe(false);
    };
    await assertIsolated();
    try {
      await t.owner.query('ALTER TABLE health_profiles DISABLE ROW LEVEL SECURITY');
      await expect(assertIsolated()).rejects.toThrow();
    } finally {
      await t.owner.query('ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY');
    }
    await assertIsolated();
  });

  for (const { route, task } of HOUSEHOLD_ROUTE_PLAN) {
    it.todo(`TC-867: ${route} — thêm probe cùng ${task}; chưa tính PASS`);
  }
});
