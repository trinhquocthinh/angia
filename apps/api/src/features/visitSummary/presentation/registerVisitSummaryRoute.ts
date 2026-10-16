import { visitSummarySchema } from '@angia/contracts';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { MedicationClock } from '@src/features/medications/application/managementPorts.js';
import { toAdherencePeriodResponse } from '@src/features/adherence/presentation/toAdherencePeriodResponse.js';
import { toLabResultResponse } from '@src/features/labResults/presentation/toLabResultResponse.js';
import { toMeasurementResponse } from '@src/features/measurements/presentation/toMeasurementResponse.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getVisitSummary } from '../application/getVisitSummary.js';
import type { VisitSummaryRepository } from '../application/ports.js';
import { visitSummaryRoute } from './visitSummaryRouteDefinition.js';

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
// parse qua hợp đồng để loại trường nội bộ (tên chuẩn hóa, trạng thái đồng thuận…).
export function registerVisitSummaryRoute(
  app: OpenAPIHono<AppEnv>,
  repository: VisitSummaryRepository,
  now: MedicationClock,
): void {
  app.openapi(visitSummaryRoute, async (c) => {
    const result = await getVisitSummary(
      repository,
      { ...c.req.valid('query'), familyId: c.get('session')!.family!.id, profileId: c.req.valid('param').id },
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    const summary = result.value;
    return c.json(
      visitSummarySchema.parse({
        ...summary,
        createdAt: summary.createdAt.toISOString(),
        currentMedications: summary.currentMedications.map((course) => ({
          ...course,
          strength: course.strength ?? null,
        })),
        measurements: summary.measurements.map(toMeasurementResponse),
        latestLabResults: summary.latestLabResults.map(toLabResultResponse),
        adherencePeriods: summary.adherencePeriods.map(toAdherencePeriodResponse),
      }),
      200,
    );
  });
}
