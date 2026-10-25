import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { healthResponseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { checkHealth } from '../application/checkHealth.js';
import type { HealthProbes } from '../application/ports.js';

const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['system'],
  summary: 'Kiểm tra sức khỏe hệ thống (DB + storage)',
  responses: {
    200: {
      description: 'Mọi phụ thuộc hoạt động',
      content: { 'application/json': { schema: healthResponseSchema } },
    },
    503: {
      description: 'Ít nhất một phụ thuộc không phản hồi',
      content: { 'application/json': { schema: healthResponseSchema } },
    },
  },
});

export function registerHealthRoute(app: OpenAPIHono<AppEnv>, probes: HealthProbes): void {
  app.openapi(healthRoute, async (c) => {
    const report = await checkHealth(probes);
    c.header('Cache-Control', 'no-store');
    return report.status === 'ok' ? c.json(report, 200) : c.json(report, 503);
  });
}
