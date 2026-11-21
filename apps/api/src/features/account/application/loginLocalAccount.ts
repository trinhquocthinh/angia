import { computeSessionExpiry } from '@src/shared/auth/domain/computeSessionExpiry.js';
import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { LoginLocalAccountDeps, LoginLocalAccountOutcome } from './ports.js';

export async function loginLocalAccount(
  deps: LoginLocalAccountDeps,
  input: { username: string; password: string; ip: string },
): Promise<LoginLocalAccountOutcome> {
  // Cùng chuẩn hoá với đăng ký (trim + chữ thường) để khoá rate limit và tra credential khớp nhau.
  const username = input.username.trim().toLowerCase();
  const key = { ip: input.ip, username };
  const policy = rateLimitPolicies.login_failed;
  try {
    const limit = await checkRateLimit(deps.rateLimit, policy, key);
    if (limit.blocked) {
      return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
    }
    const identity = await deps.identity.verifyPassword(username, input.password);
    if (!identity) {
      await recordRateLimitHit(deps.rateLimit, policy, key);
      return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    }
    if (identity.lockedAt !== null) return { ok: false, code: 'ERR_ACCOUNT_LOCKED' };
    const now = deps.now();
    if (
      identity.mustChangePassword &&
      identity.tempPasswordExpiresAt &&
      identity.tempPasswordExpiresAt <= now
    ) {
      await recordRateLimitHit(deps.rateLimit, policy, key);
      return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    }
    const passwordResetBy = identity.mustChangePassword
      ? await deps.passwordResetNotices.findLatestActor(identity.accountId)
      : null;
    const csrfToken = deps.generateToken();
    const expiresAt = computeSessionExpiry(now);
    const passwordChangeRequired = identity.mustChangePassword;
    const result = await deps.localLoginSessions.createIfCurrent({
      accountId: identity.accountId,
      expectedCredentialVersion: identity.credentialVersion,
      csrfToken,
      expiresAt,
      passwordChangeRequired,
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.reason === 'locked' ? 'ERR_ACCOUNT_LOCKED' : 'ERR_INVALID_CREDENTIALS',
      };
    }
    return {
      ok: true,
      session: { sessionId: result.sessionId, csrfToken, expiresAt, passwordChangeRequired, passwordResetBy },
    };
  } catch (error) {
    // Bao gồm store/DB/hash lỗi hoặc timeout; không fallback sang IdP hay báo sai mật khẩu.
    // reason chỉ là tên lớp lỗi để log, không mang username/IP/thông điệp hạ tầng.
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
