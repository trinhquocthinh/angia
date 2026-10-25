import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { ResolveSessionDeps } from '../application/ports.js';
import { resolveSession } from '../application/resolveSession.js';
import type { CookieSettings } from './pendingLoginCookie.js';
import { readSessionId, writeSessionCookie } from './sessionCookie.js';

// Gán c.var.session cho mọi request (null nếu không có phiên còn hạn); không tự chặn request nào.
export function loadSession(deps: ResolveSessionDeps, cookies: CookieSettings) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const sessionId = await readSessionId(c, cookies);
    const resolved = sessionId ? await resolveSession(deps, sessionId) : null;
    c.set('session', resolved?.session ?? null);
    if (resolved?.refreshed) {
      await writeSessionCookie(c, resolved.session, cookies);
    }
    await next();
  });
}
