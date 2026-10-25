import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { listAdherencePeriods } from '../application/listAdherencePeriods.js';
import type { AdherenceClock, AdherenceRepository } from '../application/ports.js';
import { recordAdherencePeriod } from '../application/recordAdherencePeriod.js';
import { listAdherencePeriodsRoute, recordAdherencePeriodRoute } from './adherenceRouteDefinitions.js';
import { toAdherencePeriodResponse } from './toAdherencePeriodResponse.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes (BR-031: main ghi).
export function registerAdherenceRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: AdherenceRepository,
  now: AdherenceClock,
): void {
  app.openapi(listAdherencePeriodsRoute, async (c) => {
    const result = await listAdherencePeriods(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      { today: result.value.today, periods: result.value.periods.map(toAdherencePeriodResponse) },
      200,
    );
  });
  app.openapi(recordAdherencePeriodRoute, async (c) => {
    const session = c.get('session')!;
    const result = await recordAdherencePeriod(
      repository,
      {
        ...c.req.valid('json'),
        familyId: session.family!.id,
        accountId: session.account.id,
        profileId: c.req.valid('param').id,
      },
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(toAdherencePeriodResponse(result.value), 201);
  });
}
