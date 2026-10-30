import type { OpenAPIHono } from '@hono/zod-openapi';
import { medicationCourseSchema } from '@angia/contracts';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { PrescriptionChainRepository } from '../application/prescriptionChainPorts.js';
import { listPrescriptions } from '../application/listPrescriptions.js';
import { getPrescriptionDetail } from '../application/getPrescriptionDetail.js';
import { toPrescriptionResponse } from './toPrescriptionResponse.js';
import { getPrescriptionDetailRoute, listPrescriptionsRoute } from './prescriptionChainRouteDefinitions.js';

// requireMain/no-store từ registerProfileRoutes; phiên từ createApp.
export function registerPrescriptionChainRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: PrescriptionChainRepository,
): void {
  app.openapi(listPrescriptionsRoute, async (c) => {
    const result = await listPrescriptions(repository, c.get('session')!.family!.id, c.req.valid('param').id);
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(getPrescriptionDetailRoute, async (c) => {
    const { id, prescriptionId } = c.req.valid('param');
    const result = await getPrescriptionDetail(repository, c.get('session')!.family!.id, id, prescriptionId);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      {
        ...result.value,
        prescription: toPrescriptionResponse(result.value.prescription),
        courses: result.value.courses.map((course) =>
          medicationCourseSchema.parse({ ...course, strength: course.strength ?? null }),
        ),
      },
      200,
    );
  });
}
