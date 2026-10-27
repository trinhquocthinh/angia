import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ScanQuotaDependencies } from '../application/ports.js';
import { mutateScanQuota } from '../application/mutateScanQuota.js';
import {
  getAdminScanQuotasRoute,
  putScanQuotaPolicyRoute,
  postScanQuotaGrantsRoute,
  getFamilyScanQuotaRoute,
} from './scanQuotaRouteDefinitions.js';
export function registerScanQuotaRoutes(app: OpenAPIHono<AppEnv>, deps: ScanQuotaDependencies): void {
  app.openapi(getAdminScanQuotasRoute, async (c) =>
    c.json(
      await deps.repository.readAdmin({ now: deps.now(), defaultMonthlyCapUsd: deps.defaultMonthlyCapUsd }),
      200,
    ),
  );
  app.openapi(putScanQuotaPolicyRoute, async (c) => {
    const outcome = await mutateScanQuota(deps, 'policy', c.req.valid('json'), currentSession(c).account.id);
    return outcome.ok ? c.json(outcome.view, 200) : c.json(...errorJson(outcome.code));
  });
  app.openapi(postScanQuotaGrantsRoute, async (c) => {
    const outcome = await mutateScanQuota(deps, 'grant', c.req.valid('json'), currentSession(c).account.id);
    return outcome.ok ? c.json(outcome.view, 200) : c.json(...errorJson(outcome.code));
  });
  app.openapi(getFamilyScanQuotaRoute, async (c) => {
    const family = currentSession(c).family;
    if (!family) return c.json(...errorJson('ERR_FORBIDDEN'));
    if (c.req.header('content-length') && c.req.header('content-length') !== '0')
      return c.json(...errorJson('ERR_VALIDATION'));
    return c.json(await deps.repository.readFamily(family.id, deps.now()), 200);
  });
}
