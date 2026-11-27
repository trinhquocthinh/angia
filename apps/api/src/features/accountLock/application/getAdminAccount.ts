import type { AccountLockRepository } from './ports.js';

export async function getAdminAccount(repository: AccountLockRepository, accountId: string) {
  const value = await repository.get(accountId);
  if (!value) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  return { ok: true, value } as const;
}
