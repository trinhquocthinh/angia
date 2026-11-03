import type { OpenAPIHono } from '@hono/zod-openapi';
import { temperatureReadingSchema, type TemperatureReading as TemperatureResponse } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { deleteTemperature } from '../application/deleteTemperature.js';
import { listTemperatures } from '../application/listTemperatures.js';
import type { TemperatureClock, TemperatureRepository } from '../application/ports.js';
import { recordTemperature } from '../application/recordTemperature.js';
import type { TemperatureReading } from '../domain/TemperatureReading.js';
import {
  deleteTemperatureRoute,
  listTemperaturesRoute,
  recordTemperatureRoute,
} from './temperatureRouteDefinitions.js';

const toResponse = (reading: TemperatureReading): TemperatureResponse =>
  temperatureReadingSchema.parse({
    ...reading,
    measuredAt: reading.measuredAt.toISOString(),
    recordedAt: reading.recordedAt.toISOString(),
  });

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes (BR-055: main ghi).
export function registerTemperatureRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: TemperatureRepository,
  now: TemperatureClock,
): void {
  app.openapi(recordTemperatureRoute, async (c) => {
    const session = c.get('session')!;
    const body = c.req.valid('json');
    const result = await recordTemperature(
      repository,
      {
        ...body,
        measuredAt: new Date(body.measuredAt),
        familyId: session.family!.id,
        accountId: session.account.id,
        profileId: c.req.valid('param').id,
      },
      now,
    );
    if (!result.ok)
      return result.code === 'ERR_OUT_OF_RANGE_UNCONFIRMED'
        ? c.json(...errorJson(result.code, { fields: result.fields }))
        : c.json(...errorJson(result.code));
    return c.json(toResponse(result.value), 201);
  });
  app.openapi(listTemperaturesRoute, async (c) => {
    const target = { familyId: c.get('session')!.family!.id, profileId: c.req.valid('param').id };
    const result = await listTemperatures(repository, { ...target, ...c.req.valid('query') });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ readings: result.value.map(toResponse) }, 200);
  });
  app.openapi(deleteTemperatureRoute, async (c) => {
    const { id, readingId } = c.req.valid('param');
    const result = await deleteTemperature(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: id,
      readingId,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
}
