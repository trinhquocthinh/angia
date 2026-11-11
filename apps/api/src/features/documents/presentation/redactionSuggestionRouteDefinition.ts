import { createRoute, z } from '@hono/zod-openapi';
import { errorResponseSchema, redactionSuggestionsResponseSchema } from '@angia/contracts';

const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponseSchema } },
});

export const redactionSuggestionRoute = createRoute({
  method: 'post',
  path: '/api/health-profiles/{id}/redaction-suggestions',
  tags: ['documents'],
  summary:
    'Gợi ý vùng che bằng ocr-mask nội bộ: ảnh xử lý trong RAM, không lưu, chỉ trả toạ độ khung (SPEC-083)',
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      required: true,
      content: {
        'multipart/form-data': { schema: z.object({ image: z.string().meta({ format: 'binary' }) }) },
      },
    },
  },
  responses: {
    200: {
      description: 'Tối đa 64 khung đã gộp, cùng hệ toạ độ PrivacyEdits; không có chữ OCR',
      content: { 'application/json': { schema: redactionSuggestionsResponseSchema } },
    },
    401: error('ERR_UNAUTHENTICATED'),
    403: error('ERR_FORBIDDEN: cần main cùng gia đình và CSRF'),
    404: error('ERR_NOT_FOUND: hồ sơ không thuộc gia đình'),
    408: error('ERR_UPLOAD_TIMEOUT: 30 giây không có dữ liệu hoặc body quá 120 giây'),
    409: error('ERR_CONSENT_REQUIRED'),
    422: error('ERR_VALIDATION: thiếu/thừa tệp, không phải JPEG hoặc vượt 10 MiB'),
    429: error('ERR_RATE_LIMITED — SPEC-030'),
    503: error(
      'ERR_SUGGESTION_BUSY (đã có 2 yêu cầu; Retry-After: 15) | ERR_SUGGESTION_UNAVAILABLE (chưa cấu hình hoặc ocr-mask lỗi)',
    ),
  },
});
