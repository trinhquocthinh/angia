import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createManualRecords } from '../application/createManualRecords.js';
import type { ReviewRepository } from '../application/reviewPorts.js';
import { manualRecordsRoute } from './manualRecordRouteDefinitions.js';
import { toClinicalRecordsResponse } from './toApprovedDocumentResponse.js';
import { toApproveErrorJson } from './toApproveErrorJson.js';

// SPEC-011 không kèm ảnh. requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerManualRecordRoutes(app: OpenAPIHono<AppEnv>, repository: ReviewRepository): void {
  app.openapi(manualRecordsRoute, async (c) => {
    const result = await createManualRecords(repository, {
      ...c.req.valid('json'),
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
    });
    if (!result.ok) return c.json(...toApproveErrorJson(result));
    return c.json(toClinicalRecordsResponse(result.value), 200);
  });
}
