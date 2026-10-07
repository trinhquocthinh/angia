import { computeSessionExpiry } from '../domain/computeSessionExpiry.js';
import type { SessionContext } from '../domain/SessionContext.js';
import { shouldSlideSession } from '../domain/shouldSlideSession.js';
import type { ResolveSessionDeps } from './ports.js';

export interface ResolvedSession {
  session: SessionContext;
  // true khi hạn phiên vừa được trượt: tầng HTTP phải đặt lại cookie với Expires mới.
  refreshed: boolean;
}

// Đọc phiên còn hạn theo id trong cookie; trượt hạn 30 ngày khi đã dùng qua ≥ 1 ngày.
export async function resolveSession(
  deps: ResolveSessionDeps,
  sessionId: string,
): Promise<ResolvedSession | null> {
  const now = deps.now();
  const session = await deps.sessions.findActive(sessionId, now);
  if (!session) {
    return null;
  }
  if (!shouldSlideSession(session.expiresAt, now)) {
    return { session, refreshed: false };
  }
  const expiresAt = computeSessionExpiry(now);
  await deps.sessions.extend(session.sessionId, expiresAt);
  return { session: { ...session, expiresAt }, refreshed: true };
}
