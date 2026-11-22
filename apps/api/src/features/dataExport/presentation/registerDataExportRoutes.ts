import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { DataExportDependencies } from '../application/ports.js';
import { requestDataExport } from '../application/requestDataExport.js';
import { getDataExport } from '../application/getDataExport.js';
import { openDataExport } from '../application/openDataExport.js';
import {
  dataExportFileRoute,
  dataExportStatusRoute,
  requestDataExportRoute,
} from './dataExportRouteDefinitions.js';

export function registerDataExportRoutes(app: OpenAPIHono<AppEnv>, deps: DataExportDependencies): void {
  app.use('/api/me/data-exports*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.openapi(requestDataExportRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const { scope } = c.req.valid('json');
    const result = await requestDataExport(deps.repository, {
      accountId: session.account.id,
      familyId: session.family?.id ?? null,
      role: session.role,
      profileId: scope === 'self' ? null : scope.profileId,
    });
    if (!result.ok) {
      if (result.code === 'ERR_RATE_LIMITED') c.header('Retry-After', String(result.retryAfterSeconds));
      return c.json(...errorJson(result.code));
    }
    return c.json({ exportId: result.exportId }, 202);
  });
  app.openapi(dataExportStatusRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const row = await getDataExport(deps, session.account.id, c.req.valid('param').id);
    if (!row) return c.json(...errorJson('ERR_NOT_FOUND'));
    return c.json({ status: row.status, expiresAt: row.expiresAt?.toISOString() ?? null }, 200);
  });
  app.openapi(dataExportFileRoute, async (c) => {
    const session = c.get('session');
    if (!session) return c.json(...errorJson('ERR_UNAUTHENTICATED'));
    const file = await openDataExport(deps, session.account.id, c.req.valid('param').id);
    if (!file) return c.json(...errorJson('ERR_NOT_FOUND'));
    c.header('Content-Type', 'application/zip');
    c.header('Content-Disposition', `attachment; filename="${file.filename}"`);
    return c.body(file.body, 200);
  });
}
