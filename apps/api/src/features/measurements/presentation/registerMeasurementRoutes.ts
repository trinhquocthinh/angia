import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getMeasurementSeries } from '../application/getMeasurementSeries.js';
import { listMeasurements } from '../application/listMeasurements.js';
import type { MeasurementRepository } from '../application/ports.js';
import { listMeasurementsRoute, measurementSeriesRoute } from './measurementRouteDefinitions.js';
import { toMeasurementResponse } from './toMeasurementResponse.js';
import { toSeriesPointResponse } from './toSeriesPointResponse.js';

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerMeasurementRoutes(app: OpenAPIHono<AppEnv>, repository: MeasurementRepository): void {
  app.openapi(listMeasurementsRoute, async (c) => {
    const { kind, limit, cursor } = c.req.valid('query');
    const result = await listMeasurements(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      kind,
      page: { limit, cursor },
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      { items: result.value.items.map(toMeasurementResponse), nextCursor: result.value.nextCursor },
      200,
    );
  });
  app.openapi(measurementSeriesRoute, async (c) => {
    const { kind, from, to, displayGlucoseUnit } = c.req.valid('query');
    const result = await getMeasurementSeries(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      kind,
      from,
      to,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    const points = result.value.points.map((point) => toSeriesPointResponse(point, displayGlucoseUnit));
    return c.json({ points, weeks: result.value.weeks }, 200);
  });
}
