import type { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '@src/shared/auth/presentation/requireAdmin.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { FamilyCapDependencies } from '../application/familyCapPorts.js';
import { listFamilyExtractionCaps } from '../application/listFamilyExtractionCaps.js';
import { setFamilyExtractionCap } from '../application/setFamilyExtractionCap.js';
import { listFamilyCapsRoute, setFamilyCapRoute } from './familyCapRouteDefinitions.js';

// Chỉ Quản trị hệ thống (SPEC-031); khai báo requireAdmin riêng để không phụ thuộc thứ tự đăng ký route.
export function registerFamilyCapRoutes(app: OpenAPIHono<AppEnv>, deps: FamilyCapDependencies): void {
  app.use('/api/admin/family-extraction-caps', requireAdmin());
  app.use('/api/admin/families/:id/extraction-cap', requireAdmin());

  app.openapi(listFamilyCapsRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(await listFamilyExtractionCaps(deps), 200);
  });

  app.openapi(setFamilyCapRoute, async (c) => {
    const saved = await setFamilyExtractionCap(deps, c.req.valid('param').id, c.req.valid('json').capUsd);
    return saved ? c.json(saved, 200) : c.json(...errorJson('ERR_NOT_FOUND'));
  });
}
