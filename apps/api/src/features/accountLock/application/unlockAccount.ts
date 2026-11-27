import type { AccountLockRepository } from './ports.js';

export async function unlockAccount(
  repository: AccountLockRepository,
  actorAccountId: string,
  accountId: string,
) {
  const value = await repository.unlock(actorAccountId, accountId);
  if (!value) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  return { ok: true, value } as const;
}
