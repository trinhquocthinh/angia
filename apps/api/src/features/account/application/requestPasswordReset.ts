import { consumeRateLimit } from '@src/shared/rateLimit/application/consumeRateLimit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import { normalizeEmail } from '../domain/normalizeEmail.js';
import type { EmailPasswordResetDeps, PasswordResetOutcome } from './passwordResetPorts.js';

type Deps = EmailPasswordResetDeps & { runInBackground: (task: () => Promise<void>) => void };
export async function requestPasswordReset(
  deps: Deps,
  input: { email: string; ip: string },
): Promise<Exclude<PasswordResetOutcome, { code: 'ERR_RESET_TOKEN_INVALID' | 'ERR_VALIDATION' }>> {
  try {
    const email = normalizeEmail(input.email) ?? input.email.trim().toLowerCase();
    // Tiêu cả hai bộ đếm cho mọi email, không phụ thuộc kết quả tra tài khoản.
    const ipLimit = await consumeRateLimit(
      deps.rateLimit,
      rateLimitPolicies.password_reset_request_ip,
      input.ip,
    );
    const emailLimit = await consumeRateLimit(
      deps.rateLimit,
      rateLimitPolicies.password_reset_request_email,
      email,
    );
    if (ipLimit.blocked || emailLimit.blocked) {
      return {
        ok: false,
        code: 'ERR_RATE_LIMITED',
        retryAfterSeconds: Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
      };
    }
    deps.runInBackground(() => deps.emailPasswordResets.request(email, deps.now()));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
