import type { OpenAPIHono } from '@hono/zod-openapi';
import { getLabSeries } from '@src/features/labResults/application/getLabSeries.js';
import { toLabSeriesResponse } from '@src/features/labResults/presentation/toLabSeriesResponse.js';
import { listCurrentMedications } from '@src/features/medications/application/listCurrentMedications.js';
import { toCurrentMedicationsResponse } from '@src/features/medications/presentation/toCurrentMedicationsResponse.js';
import { listRevisits } from '@src/features/prescriptions/application/listRevisits.js';
import { listTimeline } from '@src/features/timeline/application/listTimeline.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { SelfProfileRepository } from '../application/ports.js';
import { openSelfScope } from './openSelfScope.js';
import {
  selfLabSeriesRoute,
  selfMedicationsRoute,
  selfRevisitsRoute,
  selfTimelineRoute,
} from './selfProfileRouteDefinitions.js';

// Dùng lại use case của route main (đã có cổng đồng thuận) trên repository chạy trong withSelfScope.
export function registerSelfHistoryRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: SelfProfileRepository,
  now: () => Date,
): void {
  app.openapi(selfMedicationsRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await listCurrentMedications(self.scope.medications, self.familyId, self.profileId, now);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(toCurrentMedicationsResponse(result.value), 200);
  });
  app.openapi(selfRevisitsRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await listRevisits(self.scope.revisits, self.familyId, self.profileId, undefined, now);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(selfTimelineRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const query = c.req.valid('query');
    const result = await listTimeline(self.scope.timeline, self.familyId, self.profileId, query, now);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(selfLabSeriesRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const { testName } = c.req.valid('query');
    const request = { familyId: self.familyId, profileId: self.profileId, testName };
    const result = await getLabSeries(self.scope.labResults, request);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(toLabSeriesResponse(result.value), 200);
  });
}
