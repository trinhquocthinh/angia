import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi';
import { documentEntryPageSchema, documentEntryQuerySchema, errorResponseSchema } from '@angia/contracts';
import { toLabResultResponse } from '@src/features/labResults/presentation/toLabResultResponse.js';
import { toMeasurementResponse } from '@src/features/measurements/presentation/toMeasurementResponse.js';
import { toPrescriptionResponse } from '@src/features/prescriptions/presentation/toPrescriptionResponse.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { DocumentEntryRepository } from '../application/documentEntryPorts.js';
import { listDocumentEntries } from '../application/listDocumentEntries.js';
import type { DocumentEntry } from '../domain/DocumentEntry.js';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

const documentEntriesRoute = createRoute({
  method: 'get',
  path: '/api/health-profiles/{id}/document-entries',
  tags: ['documents'],
  summary: 'Danh mục chứng từ và đơn/phiếu nhập trực tiếp của hồ sơ, kèm bản ghi đã lưu (SPEC-028)',
  request: { params: z.object({ id: z.uuid() }), query: documentEntryQuerySchema },
  responses: {
    200: {
      description: 'Một trang mục theo ngày mục, thời điểm lưu, id giảm dần; nextCursor null khi hết',
      content: { 'application/json': { schema: documentEntryPageSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    422: error('ERR_VALIDATION: type, limit hoặc cursor không hợp lệ'),
  },
});

function toEntryResponse({ createdKey: _key, createdAt, records, ...entry }: DocumentEntry) {
  return {
    ...entry,
    createdAt: createdAt.toISOString(),
    records: {
      prescription: records.prescription && toPrescriptionResponse(records.prescription),
      labResults: records.labResults.map(toLabResultResponse),
      measurements: records.measurements.map(toMeasurementResponse),
    },
  };
}

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerDocumentEntryRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: DocumentEntryRepository,
): void {
  app.openapi(documentEntriesRoute, async (c) => {
    const query = c.req.valid('query');
    const result = await listDocumentEntries(repository, {
      ...query,
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      { items: result.value.items.map(toEntryResponse), nextCursor: result.value.nextCursor },
      200,
    );
  });
}
