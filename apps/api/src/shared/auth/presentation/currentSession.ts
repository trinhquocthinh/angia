import type { Context } from 'hono';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SessionContext } from '../domain/SessionContext.js';

// Dùng trong handler đã qua requireSession; thiếu phiên ở đây là lỗi lắp ráp middleware (→ ERR_INTERNAL).
export function currentSession(c: Context<AppEnv>): SessionContext {
  const session = c.get('session');
  if (!session) {
    throw new Error('Route được bảo vệ chạy khi chưa qua requireSession');
  }
  return session;
}
