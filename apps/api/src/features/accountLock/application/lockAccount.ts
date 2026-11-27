import type { AccountLockRepository } from './ports.js';

export async function lockAccount(
  repository: AccountLockRepository,
  actorAccountId: string,
  accountId: string,
  reason: string,
) {
  if (actorAccountId.toLowerCase() === accountId.toLowerCase())
    return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const value = await repository.lock(actorAccountId, accountId, reason);
  if (!value) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  return { ok: true, value } as const;
}
