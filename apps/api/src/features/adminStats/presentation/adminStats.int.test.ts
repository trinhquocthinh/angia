import type { AdminStatsResponse } from '@angia/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAdminStats } from '@src/shared/test/adminStatsFixture.js';

describe('SPEC-077: API thống kê không định danh', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  let f: Awaited<ReturnType<typeof seedAdminStats>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
    f = await seedAdminStats(t);
  });
  afterAll(async () => {
    await t?.close();
  });
  const get = (query = '', cookie = f.admin.cookie) =>
    t.app.request(`/api/admin/stats${query}`, { headers: { cookie } });

  it('TC-843: đếm xuyên ba nhà, chuỗi bốn tuần theo ngày VN; loại tài khoản đã xoá và SystemAdmin', async () => {
    const response = await get('?weeks=5');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as AdminStatsResponse;
    expect(body.weeks).toHaveLength(5);
    expect(body.weeks[0]).toEqual({
      weekStart: f.weekStart,
      families: 3,
      accounts: 3,
      familiesWithDoseConfirmation: 1,
      familiesActiveStreak4w: 1,
    });
    expect(body.weeks.map((w) => w.familiesWithDoseConfirmation)).toEqual([1, 2, 2, 2, 0]);
    expect(body.weeks.map((w) => w.familiesActiveStreak4w)).toEqual([1, 0, 0, 0, 0]);
    for (let i = 1; i < body.weeks.length; i++) {
      expect(Date.parse(body.weeks[i - 1]!.weekStart) - Date.parse(body.weeks[i]!.weekStart)).toBe(
        7 * 86400000,
      );
      expect(body.weeks[i]).toMatchObject({ families: 3, accounts: 3 });
    }
  });

  it('TC-844: phản hồi chỉ có số và ngày, đúng tập khoá, không có định danh hay tên', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    const body = (await response.json()) as AdminStatsResponse;
    expect(Object.keys(body)).toEqual(['weeks']);
    expect(body.weeks).toHaveLength(12);
    for (const week of body.weeks) {
      expect(Object.keys(week).sort()).toEqual([
        'accounts',
        'families',
        'familiesActiveStreak4w',
        'familiesWithDoseConfirmation',
        'weekStart',
      ]);
      expect(week.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const [key, value] of Object.entries(week))
        if (key !== 'weekStart') {
          expect(typeof value).toBe('number');
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
    }
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    for (const secret of [
      ...f.familyIds,
      ...f.accountIds,
      f.deleted,
      f.admin.accountId,
      'Nhà bí mật',
      'Tên bí mật',
      'Hồ sơ bí mật',
      'stats.',
    ])
      expect(serialized).not.toContain(secret);
  });

  it('TC-844: giới hạn tuần và quyền đọc trả lỗi chuẩn', async () => {
    for (const weeks of ['0', '53', '1.5', 'sai']) {
      const response = await get(`?weeks=${weeks}`);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect((await get('?weeks=1')).status).toBe(200);
    expect((await get('?weeks=52')).status).toBe(200);
    for (const [cookie, status, code] of [
      [f.normal.cookie, 403, 'ERR_FORBIDDEN'],
      ['', 401, 'ERR_UNAUTHENTICATED'],
    ] as const) {
      const response = await get('?weeks=0', cookie);
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ error: { code } });
    }
  });
});
