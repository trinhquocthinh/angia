import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import { validateNewPassword } from '../domain/validateNewPassword.js';
import type { ChangeLocalPasswordDeps, ChangeLocalPasswordOutcome } from './ports.js';

interface ChangePasswordInput {
  accountId: string;
  sessionId: string;
  passwordChangeRequired: boolean;
  currentPassword?: string | undefined;
  newPassword: string;
  ip: string;
}

export async function changeLocalPassword(
  deps: ChangeLocalPasswordDeps,
  input: ChangePasswordInput,
): Promise<ChangeLocalPasswordOutcome> {
  try {
    const credential = await deps.passwords.findCredential(input.accountId);
    if (!credential) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    if (!validateNewPassword(input.newPassword, credential.usernameNormalized)) {
      return { ok: false, code: 'ERR_VALIDATION', details: { field: 'newPassword' } };
    }
    if (!input.passwordChangeRequired) {
      if (!input.currentPassword) {
        return { ok: false, code: 'ERR_VALIDATION', details: { field: 'currentPassword' } };
      }
      const policy = rateLimitPolicies.login_failed;
      const key = { ip: input.ip, username: credential.usernameNormalized };
      const limit = await checkRateLimit(deps.rateLimit, policy, key);
      if (limit.blocked) {
        return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
      }
      if (!(await deps.hasher.verify(credential.passwordHash, input.currentPassword))) {
        await recordRateLimitHit(deps.rateLimit, policy, key);
        return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
      }
    }
    // Hash ngoài transaction để không giữ khoá account trong lúc chạy Argon2.
    const passwordHash = await deps.hasher.hash(input.newPassword);
    const result = await deps.passwords.replaceIfCurrent({
      accountId: input.accountId,
      sessionId: input.sessionId,
      expectedCredentialVersion: credential.credentialVersion,
      passwordHash,
      now: deps.now(),
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.reason === 'locked' ? 'ERR_ACCOUNT_LOCKED' : 'ERR_INVALID_CREDENTIALS',
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
