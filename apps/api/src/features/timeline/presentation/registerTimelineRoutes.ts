import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { TimelineRepository } from '../application/ports.js';
import { listTimeline } from '../application/listTimeline.js';
import { timelineRoute } from './timelineRouteDefinition.js';

// requireMain và no-store được registerProfileRoutes đăng ký trước route này.
export function registerTimelineRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: TimelineRepository,
  now: () => Date,
): void {
  app.openapi(timelineRoute, async (c) => {
    const result = await listTimeline(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
      c.req.valid('query'),
      now,
    );
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
}
