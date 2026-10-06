import type { OpenAPIHono } from '@hono/zod-openapi';
import { bodyLimit } from 'hono/body-limit';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import type { DocumentDependencies } from '../application/ports.js';
import { uploadDocument } from '../application/uploadDocument.js';
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD } from '../domain/SourceDocument.js';
import { uploadBatchRoute } from './documentRouteDefinitions.js';
import { toUploadBatchResponse } from './toUploadBatchResponse.js';

// Chặn body quá lớn trước khi parse multipart vào bộ nhớ (API mem_limit 256 MB); 64 KiB dư cho phần đầu multipart.
// Với ảnh đơn, body vượt ngưỡng nghĩa là tệp duy nhất quá lớn → ERR_NO_VALID_FILE (TC-026).
const MAX_BODY_BYTES = MAX_FILE_BYTES * MAX_FILES_PER_UPLOAD + 64 * 1024;

// requireMain + no-store cho /api/health-profiles/* đã gắn ở registerProfileRoutes.
export function registerDocumentRoutes(app: OpenAPIHono<AppEnv>, deps: DocumentDependencies): void {
  app.use(
    '/api/health-profiles/:id/upload-batches',
    bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => errorResponse(c, 'ERR_NO_VALID_FILE') }),
  );
  app.openapi(uploadBatchRoute, async (c) => {
    const session = c.get('session')!;
    const { files, declaredType } = c.req.valid('form');
    const list = Array.isArray(files) ? files : [files];
    const result = await uploadDocument(deps, {
      familyId: session.family!.id,
      accountId: session.account.id,
      profileId: c.req.valid('param').id,
      declaredType,
      files: await Promise.all(
        list.map(async (file) => ({ fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })),
      ),
    });
    return result.ok ? c.json(toUploadBatchResponse(result.value), 201) : c.json(...errorJson(result.code));
  });
}
