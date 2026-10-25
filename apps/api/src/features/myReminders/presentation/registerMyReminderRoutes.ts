import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import { getMyReminder } from '../application/getMyReminder.js';
import type { MyReminderRepository } from '../application/ports.js';
import { getMyReminderRoute } from './myReminderRouteDefinitions.js';

// requireSession toàn API; không requireMain (member nhận nhắc của hồ sơ liên kết). Guard family + no-store
// gắn riêng vì middleware /api/me/* chỉ có khi push bật; chạy lặp khi push bật vẫn vô hại.
export function registerMyReminderRoutes(app: OpenAPIHono<AppEnv>, repository: MyReminderRepository): void {
  app.use('/api/me/reminders/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!currentSession(c).family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(getMyReminderRoute, async (c) => {
    const session = currentSession(c);
    const actor = { familyId: session.family!.id, accountId: session.account.id };
    const result = await getMyReminder(repository, actor, c.req.valid('param').reminderId);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
