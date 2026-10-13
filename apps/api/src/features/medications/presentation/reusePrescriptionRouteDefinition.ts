import { createRoute, z } from '@hono/zod-openapi';
import {
  courseConflictErrorResponseSchema,
  errorResponseSchema,
  reusePrescriptionRequestSchema,
  reusePrescriptionResponseSchema,
} from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const reusePrescriptionRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/prescriptions/{prescriptionId}/reuse',
  tags: ['medications'],
  summary: 'Dùng lại đơn đã lưu: sinh đợt thuốc mới từ các dòng chọn (SPEC-029)',
  request: {
    params: z.object({ id: z.uuid(), prescriptionId: z.uuid() }),
    body: { required: true, content: { 'application/json': { schema: reusePrescriptionRequestSchema } } },
  },
  responses: {
    201: {
      description: 'Các đợt mới theo thứ tự dòng gửi lên',
      content: { 'application/json': { schema: reusePrescriptionResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND: hồ sơ hoặc đơn không thuộc gia đình/hồ sơ'),
    409: {
      ...error('ERR_CONSENT_REQUIRED, ERR_COURSE_CONFLICT_UNRESOLVED'),
      content: {
        'application/json': { schema: z.union([errorResponseSchema, courseConflictErrorResponseSchema]) },
      },
    },
    422: error('ERR_VALIDATION, ERR_DOSE_INFO_MISSING (details.invalidItemIndexes)'),
  },
});
