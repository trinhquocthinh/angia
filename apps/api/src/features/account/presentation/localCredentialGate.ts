import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

// Đặt trước loadSession/requireSession: cờ tắt luôn 404, kể cả body hoặc phiên không hợp lệ.
export function localCredentialGate(enrollmentEnabled: boolean) {
  return createMiddleware<AppEnv>(async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!enrollmentEnabled) return errorResponse(c, 'ERR_NOT_FOUND');
    await next();
  });
}
