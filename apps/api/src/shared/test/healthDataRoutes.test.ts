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
    const selfRoutes: RouteOfKind<'self'>[] = [];
    expect(registered().filter((route) => SELF_PATH.test(route))).toEqual(selfRoutes);
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
