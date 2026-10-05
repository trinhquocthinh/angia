import { timingSafeEqual } from 'node:crypto';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isCsrfTokenValid(expected: string, provided: string | undefined): boolean {
  if (!provided) {
    return false;
  }
  const [a, b] = [Buffer.from(expected), Buffer.from(provided)];
  return a.length === b.length && timingSafeEqual(a, b);
}

// Chặn sau loadSession: thiếu phiên → 401; request đột biến thiếu/sai X-CSRF-Token → 403 (Tech Spec §5.1, TC-078).
export function requireSession() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get('session');
    if (!session) {
      return errorResponse(c, 'ERR_UNAUTHENTICATED');
    }
    if (
      MUTATING_METHODS.has(c.req.method) &&
      !isCsrfTokenValid(session.csrfToken, c.req.header('x-csrf-token'))
    ) {
      return errorResponse(c, 'ERR_FORBIDDEN');
    }
    await next();
  });
}
