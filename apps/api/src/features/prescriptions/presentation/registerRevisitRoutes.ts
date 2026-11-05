import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { listRevisits } from '../application/listRevisits.js';
import { setRevisitDate } from '../application/setRevisitDate.js';
import type { RevisitRepository } from '../application/revisitPorts.js';
import { listRevisitsRoute, setRevisitDateRoute } from './revisitRouteDefinitions.js';

// requireMain/no-store từ registerProfileRoutes; requireSession và CSRF áp dụng toàn API.
export function registerRevisitRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: RevisitRepository,
  now: () => Date,
): void {
  app.openapi(listRevisitsRoute, async (c) => {
    const result = await listRevisits(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
      c.req.valid('query').from,
      now,
    );
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(setRevisitDateRoute, async (c) => {
    const { id, prescriptionId } = c.req.valid('param');
    const result = await setRevisitDate(
      repository,
      {
        familyId: c.get('session')!.family!.id,
        profileId: id,
        prescriptionId,
        revisitDate: c.req.valid('json').revisitDate,
      },
      now,
    );
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
}
