import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { ProfileObjectStorage } from '@src/features/profiles/application/ports.js';
import { createAccountDeletions } from '@src/features/account/infrastructure/createAccountDeletions.js';
import { createLocalPasswordChanges } from '@src/features/account/infrastructure/createLocalPasswordChanges.js';
import { createUsernameHasher } from '@src/features/account/infrastructure/createUsernameHasher.js';
import { createArgon2PasswordHasher } from '@src/shared/identity/infrastructure/createArgon2PasswordHasher.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import { createSilentLogger } from './createSilentLogger.js';

export function createProfileTestAccountDeletionDependencies(
  db: Database,
  boss: PgBoss,
  storage: ProfileObjectStorage,
) {
  return {
    passwords: createLocalPasswordChanges(db),
    hasher: createArgon2PasswordHasher(),
    rateLimit: {
      store: createRateLimitStore(db),
      keyHasher: createRateLimitKeyHasher('account-deletion-test-rate-limit'),
      now: Date.now,
    },
    store: createAccountDeletions(db, boss),
    hashUsername: createUsernameHasher('test-username-secret'.repeat(3)),
    storage,
    logger: createSilentLogger(),
  };
}
