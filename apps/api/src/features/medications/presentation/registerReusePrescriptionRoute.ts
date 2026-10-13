import { medicationCourseSchema } from '@angia/contracts';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { MedicationClock, MedicationManagementRepository } from '../application/managementPorts.js';
import { reusePrescription } from '../application/reusePrescription.js';
import { reusePrescriptionRoute } from './reusePrescriptionRouteDefinition.js';
import { toCourseConflictErrorJson } from './toCourseConflictErrorJson.js';

// SPEC-029; requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerReusePrescriptionRoute(
  app: OpenAPIHono<AppEnv>,
  repository: MedicationManagementRepository,
  now: MedicationClock,
): void {
  app.openapi(reusePrescriptionRoute, async (c) => {
    const params = c.req.valid('param');
    const result = await reusePrescription(
      repository,
      {
        ...c.req.valid('json'),
        familyId: c.get('session')!.family!.id,
        profileId: params.id,
        prescriptionId: params.prescriptionId,
      },
      now,
    );
    if (!result.ok) {
      if (result.code === 'ERR_COURSE_CONFLICT_UNRESOLVED')
        return c.json(...toCourseConflictErrorJson(result.conflicts));
      if (result.code === 'ERR_DOSE_INFO_MISSING')
        return c.json(...errorJson(result.code, { invalidItemIndexes: result.invalidItemIndexes }));
      return c.json(...errorJson(result.code));
    }
    const courses = result.value.map((course) =>
      medicationCourseSchema.parse({ ...course, strength: course.strength ?? null }),
    );
    return c.json({ courses }, 201);
  });
}
