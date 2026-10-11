import { medicationCourseSchema } from '@angia/contracts';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { createSelfReportedCourse } from '../application/createSelfReportedCourse.js';
import type { MedicationRepository } from '../application/ports.js';
import { createSelfReportedCourseRoute } from './medicationRouteDefinitions.js';
import { toCourseConflictErrorJson } from './toCourseConflictErrorJson.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes.
export function registerMedicationRoutes(app: OpenAPIHono<AppEnv>, repository: MedicationRepository): void {
  app.openapi(createSelfReportedCourseRoute, async (c) => {
    const result = await createSelfReportedCourse(repository, {
      ...c.req.valid('json'),
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
    });
    if (!result.ok)
      return result.code === 'ERR_COURSE_CONFLICT_UNRESOLVED'
        ? c.json(...toCourseConflictErrorJson(result.conflicts))
        : c.json(...errorJson(result.code));
    return c.json(
      medicationCourseSchema.parse({ ...result.value, strength: result.value.strength ?? null }),
      201,
    );
  });
}
