import type { OpenAPIHono } from '@hono/zod-openapi';
import { toSeriesResponse } from '@src/features/measurements/presentation/toSeriesResponse.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import { getSelfMeasurementSeries } from '../application/getSelfMeasurementSeries.js';
import { getSelfProfile } from '../application/getSelfProfile.js';
import { listSelfReminders } from '../application/listSelfReminders.js';
import type { SelfProfileRepository } from '../application/ports.js';
import { openSelfScope } from './openSelfScope.js';
import { registerSelfHistoryRoutes } from './registerSelfHistoryRoutes.js';
import { registerSelfObservationRoutes } from './registerSelfObservationRoutes.js';
import {
  selfMeasurementSeriesRoute,
  selfProfileRoute,
  selfRemindersRoute,
} from './selfProfileRouteDefinitions.js';

// SPEC-042: requireSession toàn API; không requireMain vì member liên kết được đọc hồ sơ của mình.
export function registerSelfProfileRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: SelfProfileRepository,
  now: () => Date,
): void {
  app.use('/api/me/profile/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!currentSession(c).family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(selfProfileRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await getSelfProfile(self.scope, self.familyId, now);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(selfRemindersRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const { date } = c.req.valid('query');
    const { account, role } = currentSession(c);
    const actor = { accountId: account.id, isMain: role === 'main' };
    const result = await listSelfReminders(self.scope, self.familyId, actor, date, now);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(selfMeasurementSeriesRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const { kind, from, to, displayGlucoseUnit } = c.req.valid('query');
    const request = { profileId: self.profileId, kind, from, to };
    const result = await getSelfMeasurementSeries(self.scope, self.familyId, request, now);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(toSeriesResponse(result.value, displayGlucoseUnit), 200);
  });
  registerSelfHistoryRoutes(app, repository, now);
  registerSelfObservationRoutes(app, repository);
}
