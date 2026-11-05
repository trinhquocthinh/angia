import type { OpenAPIHono } from '@hono/zod-openapi';
import { listAsNeededDoses } from '@src/features/asNeededDoses/application/listAsNeededDoses.js';
import { toAsNeededDoseResponse } from '@src/features/asNeededDoses/presentation/toAsNeededDoseResponse.js';
import { listTemperatures } from '@src/features/temperatures/application/listTemperatures.js';
import { toTemperatureResponse } from '@src/features/temperatures/presentation/toTemperatureResponse.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { SelfProfileRepository } from '../application/ports.js';
import { openSelfScope } from './openSelfScope.js';
import { selfAsNeededDosesRoute, selfTemperaturesRoute } from './selfProfileRouteDefinitions.js';

// SPEC-042: hồ sơ từ phiên; dùng lại use case đọc trên repository trong withSelfScope.
export function registerSelfObservationRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: SelfProfileRepository,
): void {
  app.openapi(selfTemperaturesRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const target = { familyId: self.familyId, profileId: self.profileId, ...c.req.valid('query') };
    const result = await listTemperatures(self.scope.temperatures, target);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ readings: result.value.map(toTemperatureResponse) }, 200);
  });
  app.openapi(selfAsNeededDosesRoute, async (c) => {
    const self = openSelfScope(c, repository);
    if (!self) return c.json(...errorJson('ERR_NOT_FOUND'));
    const target = { familyId: self.familyId, profileId: self.profileId, ...c.req.valid('query') };
    const result = await listAsNeededDoses(self.scope.asNeededDoses, target);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ doses: result.value.map(toAsNeededDoseResponse) }, 200);
  });
}
