import type { OpenAPIHono } from '@hono/zod-openapi';
import { uploadBatchRequestSchema } from '@angia/contracts';
import type { Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createConcurrencyLimit } from '@src/shared/http/createConcurrencyLimit.js';
import type { SlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { heavyKey, rateLimitHeavy } from '@src/shared/http/rateLimitHeavy.js';
import { spoolMultipartFiles } from '@src/shared/http/spoolMultipartFiles.js';
import type { DocumentDependencies } from '../application/ports.js';
import { quotaErrorResponse } from '../../familyQuota/presentation/quotaErrorResponse.js';
import { checkUploadQuota } from '../application/checkUploadQuota.js';
import { checkUploadTarget } from '../application/checkUploadTarget.js';
import { uploadDocument } from '../application/uploadDocument.js';
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD } from '../domain/SourceDocument.js';
import { uploadBatchRoute } from './documentRouteDefinitions.js';
import { parseSendToAi } from './parseSendToAi.js';
import { toUploadBatchResponse } from './toUploadBatchResponse.js';

// Tệp quá ngưỡng chỉ ghi tới ngưỡng + 1 byte nhưng phần thừa vẫn đi qua mạng; trần body chặn lạm dụng
// (vd. 10 tệp × 1 GB) và 1 MiB dư cho phần đầu multipart. Vượt trần → ERR_BATCH_TOO_LARGE.
const UPLOAD_LIMITS = {
  fieldName: 'files',
  maxFiles: MAX_FILES_PER_UPLOAD,
  maxFileBytes: MAX_FILE_BYTES,
  maxBodyBytes: MAX_FILES_PER_UPLOAD * MAX_FILE_BYTES + 1024 * 1024,
};
// Chủ dự án chốt tối đa 3 lô xử lý đồng thời (2026-10-07) sau khi thử 20 người tải cùng lúc bị quá tải.
// Đếm trong tiến trình: đúng vì API chạy 1 container; nhân bản API thì phải chuyển sang bộ đếm dùng chung.
const MAX_CONCURRENT_UPLOADS = 3;
const BUSY_RETRY_AFTER_SECONDS = 10;
const profileIdSchema = z.uuid();
const declaredTypeSchema = uploadBatchRequestSchema.shape.declaredType;

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
// Không dùng app.openapi: validator form của zod-openapi parse cả body vào RAM. Chỉ đăng ký tài liệu OpenAPI.
export function registerDocumentRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: DocumentDependencies,
  limiter: SlidingWindowLimiter,
): void {
  const uploadSlots = createConcurrencyLimit(MAX_CONCURRENT_UPLOADS);
  app.openAPIRegistry.registerPath(uploadBatchRoute);
  // SPEC-030: chạy sau requireMain của /api/health-profiles/* và trước kiểm hồ sơ/quota/slot.
  app.use('/api/health-profiles/:id/upload-batches', rateLimitHeavy(limiter, 'upload'));
  app.post('/api/health-profiles/:id/upload-batches', async (c) => {
    const profileId = profileIdSchema.safeParse(c.req.param('id'));
    if (!profileId.success) return errorResponse(c, 'ERR_VALIDATION');
    const session = c.get('session')!;
    const target = await checkUploadTarget(deps.repository, session.family!.id, profileId.data);
    if (!target.ok) return errorResponse(c, target.code);
    const quota = await checkUploadQuota(deps, session.family!.id);
    if (!quota.ok) return quotaErrorResponse(c, quota, deps.quota.now());
    // Giữ chỗ suốt lúc nhận body, ghi S3 và DB — đó là phần tốn đĩa, mạng và bộ nhớ.
    const release = uploadSlots.tryAcquire();
    if (!release) {
      // Web tự gửi lại khi bận (tối đa 5 lần): lượt bị từ chối vì hết slot không tính vào nhịp thao tác.
      limiter.refund(heavyKey(session.account.id, 'upload'));
      c.header('Retry-After', String(BUSY_RETRY_AFTER_SECONDS));
      return errorResponse(c, 'ERR_UPLOAD_BUSY');
    }
    try {
      return await handleUpload(c, deps, profileId.data);
    } finally {
      release();
    }
  });
}

async function handleUpload(c: Context<AppEnv>, deps: DocumentDependencies, profileId: string) {
  const spooled = await spoolMultipartFiles(c.req.raw, UPLOAD_LIMITS);
  if (!spooled.ok) return errorResponse(c, spooled.code);
  try {
    const declaredType = declaredTypeSchema.safeParse(spooled.value.fields.declaredType);
    if (!declaredType.success) return errorResponse(c, 'ERR_VALIDATION');
    const sendToAi = parseSendToAi(spooled.value.fields.sendToAi, spooled.value.files.length);
    if (!sendToAi) return errorResponse(c, 'ERR_VALIDATION');
    const session = c.get('session')!;
    const result = await uploadDocument(deps, {
      familyId: session.family!.id,
      accountId: session.account.id,
      profileId,
      declaredType: declaredType.data,
      files: spooled.value.files,
      sendToAi,
    });
    if (result.ok) return c.json(toUploadBatchResponse(result.value), 201);
    return 'details' in result
      ? quotaErrorResponse(c, result, deps.quota.now())
      : errorResponse(c, result.code);
  } finally {
    await spooled.value.dispose();
  }
}
