import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';

// Biến ngữ cảnh Hono dùng chung: loadSession gán `session` (null khi không có phiên còn hạn).
export interface AppEnv {
  Variables: {
    session: SessionContext | null;
  };
}
