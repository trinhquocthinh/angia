import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
// Đọc tối đa 16 KiB kể cả Content-Length vắng/sai; chỉ chạy sau session/main.
export function limitPrivacyBody() {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (c.req.method !== 'POST' || !c.req.raw.body) return next();
    const reader = c.req.raw.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 16 * 1024) {
          await reader.cancel();
          return c.json(
            { error: { code: 'ERR_VALIDATION', message: 'Nội dung yêu cầu vượt giới hạn 16 KiB.' } },
            413,
          );
        }
        chunks.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    c.req.raw = new Request(c.req.raw, {
      body: new ReadableStream({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
      duplex: 'half',
    } as RequestInit);
    await next();
  });
}
