import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireMain } from '@src/shared/auth/presentation/requireMain.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { FamilyUsageDependencies } from '../application/ports.js';
import { getFamilyUsage } from '../application/getFamilyUsage.js';
import { familyUsageRoute } from './familyUsageRouteDefinitions.js';

// SPEC-030: chỉ người chăm sóc chính (người tải ảnh) xem; số liệu thay đổi liên tục nên không cache.
export function registerFamilyUsageRoute(app: OpenAPIHono<AppEnv>, deps: FamilyUsageDependencies): void {
  app.use('/api/family/usage', requireMain());
  app.openapi(familyUsageRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(await getFamilyUsage(deps, c.get('session')!.family!.id), 200);
  });
}
