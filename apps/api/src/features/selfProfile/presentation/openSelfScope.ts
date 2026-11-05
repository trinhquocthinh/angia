import type { Context } from 'hono';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SelfProfileRepository } from '../application/ports.js';

// Hồ sơ chỉ lấy từ phiên; null = tài khoản không liên kết hồ sơ. Middleware đã chặn phiên không có gia đình.
export function openSelfScope(c: Context<AppEnv>, repository: SelfProfileRepository) {
  const { family, account } = currentSession(c);
  if (!account.healthProfileId) return null;
  return {
    familyId: family!.id,
    profileId: account.healthProfileId,
    scope: repository.forProfile(account.healthProfileId),
  };
}
