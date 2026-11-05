import type { Context } from 'hono';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import { confirmDose } from '../application/confirmDose.js';
import { listProfileReminders } from '../application/listProfileReminders.js';
import type { DoseConfirmationActor, DoseConfirmationRepository } from '../application/ports.js';
import { undoDoseConfirmation } from '../application/undoDoseConfirmation.js';
import {
  confirmDoseRoute,
  listProfileRemindersRoute,
  undoDoseConfirmationRoute,
} from './doseConfirmationRouteDefinitions.js';

function actorOf(c: Context<AppEnv>): DoseConfirmationActor {
  const { account, family, role } = currentSession(c);
  return {
    familyId: family!.id,
    accountId: account.id,
    isMain: role === 'main',
    displayName: account.displayName,
  };
}

// requireSession/CSRF toàn API; không requireMain vì member liên kết được xác nhận (SPEC-046). Route danh sách
// nằm dưới /api/health-profiles/* nên đã có requireMain + no-store từ registerProfileRoutes.
export function registerDoseConfirmationRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: DoseConfirmationRepository,
  now: () => Date,
): void {
  app.use('/api/reminders/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!currentSession(c).family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(confirmDoseRoute, async (c) => {
    const result = await confirmDose(repository, actorOf(c), c.req.valid('param').reminderId, now);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(undoDoseConfirmationRoute, async (c) => {
    const result = await undoDoseConfirmation(repository, actorOf(c), c.req.valid('param').reminderId, now);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
  app.openapi(listProfileRemindersRoute, async (c) => {
    const actor = actorOf(c);
    const request = {
      familyId: actor.familyId,
      profileId: c.req.valid('param').id,
      actor,
      date: c.req.valid('query').date,
    };
    const result = await listProfileReminders(repository, request, now);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
