import { createStubApp } from '@src/shared/test/createStubApp.js';
import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { registerAdminStatsRoutes } from '@src/features/adminStats/presentation/registerAdminStatsRoutes.js';
import { registerAdminAuditRoutes } from './registerAdminAuditRoutes.js';

function appFor(isSystemAdmin: boolean | null, authMethod: 'oidc' | 'local' = 'oidc') {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => (result.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  app.use('*', async (c, next) => {
    if (isSystemAdmin !== null) {
      const session: SessionContext = {
        sessionId: 'session',
        authMethod,
        oidcAuthTime: null,
        passwordChangeRequired: false,
        csrfToken: 'csrf',
        expiresAt: new Date(),
        family: null,
        role: null,
        account: {
          id: 'ab476456-4d26-4efe-a751-5abb4b413975',
          displayName: 'Quản trị',
          isSystemAdmin,
          healthProfileId: null,
        },
      };
      c.set('session', session);
    }
    await next();
  });
  registerAdminAuditRoutes(app, { repository: { list: async () => [] } });
  registerAdminStatsRoutes(app, { repository: { weekly: async () => [] } });
  return app;
}

describe('SPEC-076/077: bảo vệ và validation route đọc quản trị', () => {
  it('TC-841: phản hồi 401 từ cổng phiên chung cũng có no-store', async () => {
    for (const path of ['/api/admin/audit-events', '/api/admin/stats']) {
      const response = await createStubApp().request(path);
      expect(response.status).toBe(401);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });
  it('TC-842: không đăng ký phương thức ghi; middleware vẫn kiểm quyền', async () => {
    for (const path of [
      '/api/admin/audit-events',
      '/api/admin/audit-events/ab476456-4d26-4efe-a751-5abb4b413975',
    ]) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        for (const [admin, status] of [
          [true, 404],
          [false, 403],
          [null, 401],
        ] as const) {
          const response = await appFor(admin).request(path, { method });
          expect(response.status).toBe(status);
          expect(response.headers.get('cache-control')).toBe('no-store');
        }
      }
    }
  });
  it('TC-841: kiểm quyền trước bộ lọc; admin local không được đọc', async () => {
    for (const path of ['/api/admin/audit-events?limit=0', '/api/admin/stats?weeks=0']) {
      expect((await appFor(false).request(path)).status).toBe(403);
      expect((await appFor(null).request(path)).status).toBe(401);
      expect((await appFor(true, 'local').request(path)).status).toBe(403);
      const invalid = await appFor(true).request(path);
      expect(invalid.status).toBe(422);
      expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
  });
  it('TC-844: phản hồi thành công có no-store, cursor hỏng trả 422', async () => {
    for (const path of ['/api/admin/audit-events', '/api/admin/stats']) {
      const response = await appFor(true).request(path);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual(
        path.endsWith('stats') ? { weeks: [] } : { items: [], nextCursor: null },
      );
    }
    const invalid = await appFor(true).request('/api/admin/audit-events?cursor=abc');
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
  });
});
