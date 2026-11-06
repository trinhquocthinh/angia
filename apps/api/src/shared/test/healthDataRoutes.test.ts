import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createStubApp } from './createStubApp.js';
import {
  HEALTH_DATA_ROUTES,
  MEMBER_BLOCKED_SESSION_ROUTES,
  NON_HEALTH_DATA_ROUTES,
  type RouteOfKind,
} from './healthDataRoutes.js';

// Khớp đúng /api/me/profile và /api/me/profile/*, không gồm /api/me/profile-link/* (SPEC-050).
const SELF_PATH = / \/api\/me\/profile(\/|$)/;

const selfWriteViolations = (
  routes: Record<string, string>,
  registeredRoutes = Object.keys(routes),
): string[] =>
  Object.entries({
    ...Object.fromEntries(registeredRoutes.map((route) => [route, 'unclassified'])),
    ...routes,
  })
    .filter(([route, kind]) => {
      const [method = '', path = ''] = route.split(' ');
      const selfPath = /^\/api\/me\/profile(?:\/|$)/.test(path);
      if (kind === 'self_write') {
        return (
          !['POST', 'PATCH', 'DELETE'].includes(method) ||
          !/^\/api\/me\/profile\/pain-issues(?:\/|$)/.test(path)
        );
      }
      if (selfPath) return method !== 'GET' || kind !== 'self';
      return kind === 'self';
    })
    .map(([route]) => route);

interface SourceFile {
  path: string;
  content: string;
}

// Code tự xem nằm ở features/selfProfile hoặc tự khai báo đường dẫn /api/me/profile; không được gọi withFamilyScope.
const selfScopeViolations = (files: SourceFile[]) =>
  files
    .filter((file) => file.path.includes('features/selfProfile/') || file.content.includes('/api/me/profile'))
    .filter((file) => file.content.includes('withFamilyScope('))
    .map((file) => file.path);

const featureSources = (): SourceFile[] => {
  const root = fileURLToPath(new URL('../../features', import.meta.url));
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.ts') && !path.includes('.test.'))
    .map((path) => ({
      path: `features/${path}`,
      content: readFileSync(join(root, path), 'utf8'),
    }));
};

const registered = () =>
  [
    ...new Set(
      createStubApp()
        .routes.filter((route) => route.method !== 'ALL')
        .map((route) => `${route.method} ${route.path}`),
    ),
  ].sort();

describe('Kiểm kê route cho NFR-4', () => {
  it('TC-107: mọi route của app được phân loại đúng một lần, không có mục thừa', () => {
    const healthData = Object.keys(HEALTH_DATA_ROUTES);
    expect(healthData.filter((route) => NON_HEALTH_DATA_ROUTES.includes(route))).toEqual([]);
    expect([...healthData, ...NON_HEALTH_DATA_ROUTES].sort()).toEqual(registered());
  });

  it('TC-570: mọi route /api/me/profile/* khai báo nhóm self và không bị chặn như route main', () => {
    const selfRoutes: RouteOfKind<'self'>[] = [
      'GET /api/me/profile',
      'GET /api/me/profile/as-needed-doses',
      'GET /api/me/profile/lab-result-series',
      'GET /api/me/profile/measurements/series',
      'GET /api/me/profile/medications/current',
      'GET /api/me/profile/reminders',
      'GET /api/me/profile/revisits',
      'GET /api/me/profile/temperatures',
      'GET /api/me/profile/timeline',
    ];
    expect(registered().filter((route) => route.startsWith('GET ') && SELF_PATH.test(route))).toEqual(
      selfRoutes,
    );
    expect(MEMBER_BLOCKED_SESSION_ROUTES.filter((route) => SELF_PATH.test(route))).toEqual([]);
  });

  it('TC-570: không có code tự xem nào gọi withFamilyScope', () => {
    expect(selfScopeViolations(featureSources())).toEqual([]);
  });

  it('TC-570 phá thử: phát hiện code tự xem gọi withFamilyScope, bỏ qua code khác', () => {
    const call = 'withFamilyScope(db, familyId, work)';
    expect(
      selfScopeViolations([
        { path: 'features/selfProfile/infrastructure/repo.ts', content: call },
        { path: 'features/x/presentation/route.ts', content: `app.get('/api/me/profile/a'); ${call}` },
        { path: 'features/selfProfile/infrastructure/ok.ts', content: 'withSelfScope(db, scope, work)' },
        { path: 'features/measurements/infrastructure/repo.ts', content: call },
      ]),
    ).toEqual(['features/selfProfile/infrastructure/repo.ts', 'features/x/presentation/route.ts']);
  });
});

describe('Kiểm kê quyền ghi tự quản', () => {
  it('TC-709: phân loại route tự xem/ghi và giới hạn ghi trong sổ đau nhức', () => {
    expect(selfWriteViolations(HEALTH_DATA_ROUTES, registered())).toEqual([]);
  });

  it('TC-709 phá thử: phát hiện route tự quản bị bỏ khỏi kiểm kê sức khỏe', () => {
    const route = 'POST /api/me/profile/pain-issues';
    expect(selfWriteViolations({}, [route])).toEqual([route]);
  });

  it('TC-709: chấp nhận GET tự xem và POST/PATCH/DELETE tự quản đúng tiền tố', () => {
    expect(
      selfWriteViolations({
        'GET /api/me/profile': 'self',
        'GET /api/me/profile/pain-issues': 'self',
        'POST /api/me/profile/pain-issues': 'self_write',
        'PATCH /api/me/profile/pain-issues/:issueId/entries/:entryId': 'self_write',
        'DELETE /api/me/profile/pain-issues/:issueId': 'self_write',
        'POST /api/me/profile-link/unlink': 'scoped',
      }),
    ).toEqual([]);
  });

  it.each([
    ['POST /api/me/profile/temperatures', 'self_write'],
    ['PATCH /api/me/profile/pain-issues-extra/:id', 'self_write'],
    ['POST /api/me/profile/pain-issues', 'scoped'],
    ['POST /api/me/profile/pain-issues', 'self'],
    ['POST /api/me/profile/pain-issues', 'list'],
    ['GET /api/me/profile/pain-issues', 'self_write'],
    ['PUT /api/me/profile/pain-issues/:id', 'self_write'],
    ['PATCH /api/health-profiles/:id/pain-issues/:issueId', 'self_write'],
    ['GET /api/me/profile/timeline', 'scoped'],
  ])('TC-709 phá thử: phát hiện %s bị xếp vào %s', (route, kind) => {
    expect(selfWriteViolations({ [route]: kind })).toEqual([route]);
  });
});
