import type { AdminAccountDetail } from '@angia/contracts';

export interface AccountLockRepository {
  get(accountId: string): Promise<AdminAccountDetail | null>;
  lock(actorAccountId: string, accountId: string, reason: string): Promise<AdminAccountDetail | null>;
  unlock(actorAccountId: string, accountId: string): Promise<AdminAccountDetail | null>;
}

export interface AccountLockDependencies {
  repository: AccountLockRepository;
}
