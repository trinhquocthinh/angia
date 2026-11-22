import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ProfileObjectStorage } from '../../profiles/application/ports.js';
import type { PasswordHasher } from '@src/shared/identity/application/ports.js';
import type { LocalPasswordChanges } from './ports.js';

export interface AccountDeletionInput {
  accountId: string;
  password: string;
  ownProfileDisposition?: 'keep' | 'delete' | undefined;
  ip: string;
}

type AccountDeletionFailureCode =
  | 'ERR_INVALID_CREDENTIALS'
  | 'ERR_VALIDATION'
  | 'ERR_OWNER_MUST_TRANSFER'
  | 'ERR_OWNER_MUST_DELETE_FAMILY'
  | 'ERR_LAST_GUARDIAN';

export type AccountDeletionStoreResult =
  | { ok: true; familyId: string | null; deletedProfileId: string | null }
  | { ok: false; code: AccountDeletionFailureCode; details?: { profileIds: readonly string[] } };

export interface AccountDeletionStore {
  // Một transaction: rời nhà (SPEC-067) nếu còn nhà, rồi biến tài khoản thành bia mộ.
  deleteAccount(input: {
    accountId: string;
    expectedCredentialVersion: number;
    usernameHash: string;
    ownProfileDisposition?: 'keep' | 'delete' | undefined;
  }): Promise<AccountDeletionStoreResult>;
}

export interface AccountDeletionDeps {
  passwords: Pick<LocalPasswordChanges, 'findCredential'>;
  hasher: PasswordHasher;
  rateLimit: RateLimitDependencies;
  store: AccountDeletionStore;
  hashUsername(usernameNormalized: string): string;
  storage: ProfileObjectStorage;
  logger: { warn(obj: object, msg: string): void };
}

export type AccountDeletionOutcome =
  | { ok: true }
  | { ok: false; code: AccountDeletionFailureCode; details?: { profileIds: readonly string[] } }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number }
  | { ok: false; code: 'ERR_AUTH_UNAVAILABLE'; reason: string };
