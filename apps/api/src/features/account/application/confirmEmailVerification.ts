import type { AccountEmailDeps, AccountEmailFailure } from './ports.js';

export async function confirmEmailVerification(
  deps: Pick<AccountEmailDeps, 'emails' | 'now'>,
  token: string,
): Promise<{ ok: true } | AccountEmailFailure> {
  try {
    return await deps.emails.confirmVerification(token, deps.now());
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
