import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import { normalizeEmail } from '../domain/normalizeEmail.js';
import type { AccountEmailDeps, AccountEmailView, AccountEmailFailure } from './ports.js';

export async function changeAccountEmail(
  deps: AccountEmailDeps,
  input: { accountId: string; sessionId: string; email: string; currentPassword: string; ip: string },
): Promise<{ ok: true; value: AccountEmailView } | AccountEmailFailure> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, code: 'ERR_VALIDATION', details: { field: 'email' } };
  try {
    const credential = await deps.passwords.findCredential(input.accountId);
    if (!credential) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    const policy = rateLimitPolicies.login_failed;
    const key = { ip: input.ip, username: credential.usernameNormalized };
    const limit = await checkRateLimit(deps.rateLimit, policy, key);
    if (limit.blocked)
      return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
    if (!(await deps.hasher.verify(credential.passwordHash, input.currentPassword))) {
      await recordRateLimitHit(deps.rateLimit, policy, key);
      return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    }
    return await deps.emails.change({
      accountId: input.accountId,
      sessionId: input.sessionId,
      email,
      expectedCredentialVersion: credential.credentialVersion,
    });
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
