import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import { getMyRevisitReminder } from '../application/getMyRevisitReminder.js';
import type { MyRevisitReminderRepository } from '../application/ports.js';
import { getMyRevisitReminderRoute } from './myRevisitReminderRouteDefinitions.js';

export function registerMyRevisitReminderRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: MyRevisitReminderRepository,
): void {
  app.use('/api/me/revisit-reminders/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!currentSession(c).family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(getMyRevisitReminderRoute, async (c) => {
    const session = currentSession(c);
    const result = await getMyRevisitReminder(
      repository,
      { familyId: session.family!.id, accountId: session.account.id },
      c.req.valid('param').reminderId,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
