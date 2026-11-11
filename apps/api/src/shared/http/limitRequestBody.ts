import { createMiddleware } from 'hono/factory';
import type { AppEnv } from './AppEnv.js';
import { errorResponse } from './errorResponse.js';

const MAX_BODY_BYTES = 1024 * 1024;
const UPLOAD_PATH = /^\/api\/health-profiles\/[^/]+\/(upload-batches|redaction-suggestions)$/;

// Multipart có bộ nhận stream riêng; các body khác phải có trần trước khi validator parse JSON.
export function limitRequestBody() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const request = c.req.raw;
    if (!request.body || (request.method === 'POST' && UPLOAD_PATH.test(c.req.path))) return next();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > MAX_BODY_BYTES) {
          await reader.cancel().catch(() => undefined);
          return errorResponse(c, 'ERR_REQUEST_TOO_LARGE');
        }
        chunks.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    c.req.raw = new Request(request, { body: Buffer.concat(chunks, size) });
    await next();
  });
}
