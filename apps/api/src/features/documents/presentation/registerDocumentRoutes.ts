import type { OpenAPIHono } from '@hono/zod-openapi';
import { uploadBatchRequestSchema } from '@angia/contracts';
import { z } from 'zod';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { spoolMultipartFiles } from '@src/shared/http/spoolMultipartFiles.js';
import type { DocumentDependencies } from '../application/ports.js';
import { uploadDocument } from '../application/uploadDocument.js';
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD } from '../domain/SourceDocument.js';
import { uploadBatchRoute } from './documentRouteDefinitions.js';
import { toUploadBatchResponse } from './toUploadBatchResponse.js';

// Tệp quá ngưỡng chỉ ghi tới ngưỡng + 1 byte nhưng phần thừa vẫn đi qua mạng; trần body chặn lạm dụng
// (vd. 10 tệp × 1 GB) và 1 MiB dư cho phần đầu multipart. Vượt trần → ERR_BATCH_TOO_LARGE.
const UPLOAD_LIMITS = {
  fieldName: 'files',
  maxFiles: MAX_FILES_PER_UPLOAD,
  maxFileBytes: MAX_FILE_BYTES,
  maxBodyBytes: MAX_FILES_PER_UPLOAD * MAX_FILE_BYTES + 1024 * 1024,
};
const profileIdSchema = z.uuid();
const declaredTypeSchema = uploadBatchRequestSchema.shape.declaredType;

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
// Không dùng app.openapi: validator form của zod-openapi parse cả body vào RAM. Chỉ đăng ký tài liệu OpenAPI.
export function registerDocumentRoutes(app: OpenAPIHono<AppEnv>, deps: DocumentDependencies): void {
  app.openAPIRegistry.registerPath(uploadBatchRoute);
  app.post('/api/health-profiles/:id/upload-batches', async (c) => {
    const profileId = profileIdSchema.safeParse(c.req.param('id'));
    if (!profileId.success) return errorResponse(c, 'ERR_VALIDATION');
    const spooled = await spoolMultipartFiles(c.req.raw, UPLOAD_LIMITS);
    if (!spooled.ok) return errorResponse(c, spooled.code);
    try {
      const declaredType = declaredTypeSchema.safeParse(spooled.value.fields.declaredType);
      if (!declaredType.success) return errorResponse(c, 'ERR_VALIDATION');
      const session = c.get('session')!;
      const result = await uploadDocument(deps, {
        familyId: session.family!.id,
        accountId: session.account.id,
        profileId: profileId.data,
        declaredType: declaredType.data,
        files: spooled.value.files,
      });
      return result.ok ? c.json(toUploadBatchResponse(result.value), 201) : errorResponse(c, result.code);
    } finally {
      await spooled.value.dispose();
    }
  });
}
