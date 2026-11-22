import { validateNewPassword } from '../domain/validateNewPassword.js';
import type { EmailPasswordResetDeps, PasswordResetOutcome } from './passwordResetPorts.js';

export async function resetPasswordByEmail(
  deps: Pick<EmailPasswordResetDeps, 'emailPasswordResets' | 'hasher' | 'now'>,
  input: { token: string; newPassword: string },
): Promise<PasswordResetOutcome> {
  try {
    const account = await deps.emailPasswordResets.findValid(input.token, deps.now());
    if (!account) return { ok: false, code: 'ERR_RESET_TOKEN_INVALID' };
    if (!validateNewPassword(input.newPassword, account.usernameNormalized ?? '')) {
      return { ok: false, code: 'ERR_VALIDATION', details: { field: 'newPassword' } };
    }
    // Argon2 ngoài transaction; repository khoá account rồi token và kiểm lại sau hash.
    const hash = await deps.hasher.hash(input.newPassword);
    const consumed = await deps.emailPasswordResets.consume(input.token, account.accountId, hash, deps.now());
    return consumed ? { ok: true } : { ok: false, code: 'ERR_RESET_TOKEN_INVALID' };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
