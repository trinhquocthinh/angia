import { medicationCourseSchema } from '@angia/contracts';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { createSelfReportedCourse } from '../application/createSelfReportedCourse.js';
import type { MedicationManagementRepository, MedicationClock } from '../application/managementPorts.js';
import { stopCourse } from '../application/stopCourse.js';
import { listStoppableCourses } from '../application/listStoppableCourses.js';
import { stopCourseRoute, listStoppableCoursesRoute } from './stopCourseRouteDefinitions.js';
import { createSelfReportedCourseRoute } from './medicationRouteDefinitions.js';
import { toCourseConflictErrorJson } from './toCourseConflictErrorJson.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes.
export function registerMedicationRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: MedicationManagementRepository,
  now: MedicationClock,
): void {
  app.openapi(listStoppableCoursesRoute, async (c) => {
    const result = await listStoppableCourses(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      {
        ...result.value,
        courses: result.value.courses.map((course) =>
          medicationCourseSchema.parse({ ...course, strength: course.strength ?? null }),
        ),
      },
      200,
    );
  });
  app.openapi(stopCourseRoute, async (c) => {
    const params = c.req.valid('param');
    const result = await stopCourse(
      repository,
      {
        ...c.req.valid('json'),
        familyId: c.get('session')!.family!.id,
        profileId: params.id,
        courseId: params.courseId,
      },
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      medicationCourseSchema.parse({ ...result.value, strength: result.value.strength ?? null }),
      200,
    );
  });
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
