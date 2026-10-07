import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { listMeasurements } from '../application/listMeasurements.js';
import type { MeasurementRepository } from '../application/ports.js';
import { listMeasurementsRoute } from './measurementRouteDefinitions.js';
import { toMeasurementResponse } from './toMeasurementResponse.js';

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerMeasurementRoutes(app: OpenAPIHono<AppEnv>, repository: MeasurementRepository): void {
  app.openapi(listMeasurementsRoute, async (c) => {
    const result = await listMeasurements(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      kind: c.req.valid('query').kind,
    });
    return result.ok
      ? c.json(result.value.map(toMeasurementResponse), 200)
      : c.json(...errorJson(result.code));
  });
}
