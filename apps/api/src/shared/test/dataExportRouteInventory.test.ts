import { expect, it, vi } from 'vitest';
import { HEALTH_DATA_ROUTES, MEMBER_BLOCKED_SESSION_ROUTES } from './healthDataRoutes.js';
import { createHealthDataProbes } from './createHealthDataProbes.js';
import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { Target } from './CrossFamilyTarget.js';

const routes = [
  'POST /api/me/data-exports',
  'GET /api/me/data-exports/:id',
  'GET /api/me/data-exports/:id/file',
];

it('TC-107: ba route tải dữ liệu được kiểm kê chéo gia đình và không chặn member self', () => {
  const inventory: Record<string, string> = HEALTH_DATA_ROUTES;
  expect(routes.map((route) => inventory[route])).toEqual(['scoped', 'scoped', 'scoped']);
  expect(routes.filter((route) => MEMBER_BLOCKED_SESSION_ROUTES.includes(route))).toEqual([]);
});

it('TC-826: probe tải dữ liệu dùng đúng ID export và ID hồ sơ đích', async () => {
  const call = vi.fn(async () => new Response(null, { status: 404 }));
  const probes: Record<string, ((user: SeededSession, target: Target) => unknown) | undefined> =
    createHealthDataProbes({ call } as unknown as ProfileTestApp);
  const user = {} as SeededSession;
  const target = { exportId: 'export-id', profileId: 'profile-id' } as unknown as Target;
  for (const route of routes) {
    const probe = probes[route];
    expect(probe).toBeTypeOf('function');
    await probe!(user, target);
  }
  expect(call.mock.calls).toEqual([
    [user, 'POST', '/api/me/data-exports', { scope: { profileId: 'profile-id' } }],
    [user, 'GET', '/api/me/data-exports/export-id'],
    [user, 'GET', '/api/me/data-exports/export-id/file'],
  ]);
});
