import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { createHousehold } from '../application/createHousehold.js';
import type { HouseholdRepository } from '../application/ports.js';
import { createHouseholdRoute } from './createHouseholdRouteDefinition.js';

// createApp đã áp dụng requireSession/CSRF, đổi mật khẩu và đồng ý pháp lý.
export function registerHouseholdRoutes(app: OpenAPIHono<AppEnv>, repository: HouseholdRepository): void {
  app.openapi(createHouseholdRoute, async (c) => {
    c.header('Cache-Control', 'no-store');
    const result = await createHousehold(repository, currentSession(c).account.id, c.req.valid('json'));
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ ...result.family, createdAt: result.family.createdAt.toISOString() }, 201);
  });
}
