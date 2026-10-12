import { currentMedicationCourseSchema } from '@angia/contracts';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { listCurrentMedications } from '../application/listCurrentMedications.js';
import type { MedicationManagementRepository, MedicationClock } from '../application/managementPorts.js';
import { listCurrentMedicationsRoute } from './currentMedicationsRouteDefinition.js';

// Danh mục thuốc E4-S4-T1; requireMain + no-store gắn trước tại registerProfileRoutes.
export function registerCurrentMedicationsRoute(
  app: OpenAPIHono<AppEnv>,
  repository: MedicationManagementRepository,
  now: MedicationClock,
): void {
  app.openapi(listCurrentMedicationsRoute, async (c) => {
    const result = await listCurrentMedications(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      {
        today: result.value.today,
        courses: result.value.courses.map((course) =>
          currentMedicationCourseSchema.parse({ ...course, strength: course.strength ?? null }),
        ),
      },
      200,
    );
  });
}
