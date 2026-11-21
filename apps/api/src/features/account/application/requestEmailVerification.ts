import type { AccountEmailDeps, AccountEmailFailure } from './ports.js';

export async function requestEmailVerification(
  deps: Pick<AccountEmailDeps, 'emails' | 'rateLimit' | 'now'>,
  accountId: string,
): Promise<{ ok: true; sent: boolean } | AccountEmailFailure> {
  try {
    // Kiểm và ghi lượt trong transaction của repository, dưới khoá account.
    return await deps.emails.requestVerification(accountId, deps.now(), deps.rateLimit);
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
