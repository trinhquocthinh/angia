import type { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createConcurrencyLimit } from '@src/shared/http/createConcurrencyLimit.js';
import type { SlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { rateLimitHeavy } from '@src/shared/http/rateLimitHeavy.js';
import { readMultipartFile } from '@src/shared/http/readMultipartFile.js';
import type { DocumentRepository } from '../application/ports.js';
import type { RedactionSuggestionDependencies } from '../application/redactionSuggestionPorts.js';
import { checkUploadTarget } from '../application/checkUploadTarget.js';
import { suggestRedactionMasks } from '../application/suggestRedactionMasks.js';
import { classifyFile } from '../domain/classifyFile.js';
import { MAX_FILE_BYTES } from '../domain/SourceDocument.js';
import { redactionSuggestionRoute } from './redactionSuggestionRouteDefinition.js';

const PATH = '/api/health-profiles/:id/redaction-suggestions';
const READ_LIMITS = {
  fieldName: 'image',
  maxFileBytes: MAX_FILE_BYTES,
  maxBodyBytes: MAX_FILE_BYTES + 64 * 1024,
  idleTimeoutMs: 30_000,
  bodyTimeoutMs: 120_000,
};
// ocr-mask xử lý lần lượt từng ảnh: một yêu cầu đang chạy, một yêu cầu chờ (SPEC-083). Đếm trong tiến trình
// như slot tải lô — đúng khi API chạy 1 container.
const MAX_CONCURRENT_SUGGESTIONS = 2;
const BUSY_RETRY_AFTER_SECONDS = 15;
const profileIdSchema = z.uuid();

// requireMain + CSRF + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
// Không dùng app.openapi: validator form parse body vào RAM không trần. Chỉ đăng ký tài liệu OpenAPI.
export function registerRedactionSuggestionRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: DocumentRepository,
  deps: RedactionSuggestionDependencies | undefined,
  limiter: SlidingWindowLimiter,
): void {
  const slots = createConcurrencyLimit(MAX_CONCURRENT_SUGGESTIONS);
  app.openAPIRegistry.registerPath(redactionSuggestionRoute);
  app.use(PATH, rateLimitHeavy(limiter, 'redaction-suggestion'));
  app.post(PATH, async (c) => {
    const profileId = profileIdSchema.safeParse(c.req.param('id'));
    if (!profileId.success) return errorResponse(c, 'ERR_VALIDATION');
    const target = await checkUploadTarget(repository, c.get('session')!.family!.id, profileId.data);
    if (!target.ok) return errorResponse(c, target.code);
    const release = slots.tryAcquire();
    if (!release) {
      c.header('Retry-After', String(BUSY_RETRY_AFTER_SECONDS));
      return errorResponse(c, 'ERR_SUGGESTION_BUSY');
    }
    try {
      const image = await readMultipartFile(c.req.raw, READ_LIMITS);
      if (!image.ok) return errorResponse(c, image.code);
      if (!classifyFile(image.bytes).ok) return errorResponse(c, 'ERR_VALIDATION');
      const result = await suggestRedactionMasks(deps, image.bytes, c.req.raw.signal);
      if (!result.ok) return errorResponse(c, result.code);
      c.header('Cache-Control', 'no-store');
      return c.json({ masks: result.masks }, 200);
    } finally {
      release();
    }
  });
}
