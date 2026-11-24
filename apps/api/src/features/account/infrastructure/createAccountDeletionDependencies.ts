import type { S3Client } from '@aws-sdk/client-s3';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { ApiConfig } from '@src/shared/config/loadApiConfig.js';
import type { PasswordHasher } from '@src/shared/identity/application/ports.js';
import { createProfileObjectStorage } from '@src/features/profiles/infrastructure/createProfileObjectStorage.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import type { AccountDeletionDeps } from '../application/deletionPorts.js';
import { createAccountDeletions } from './createAccountDeletions.js';
import { createLocalPasswordChanges } from './createLocalPasswordChanges.js';
import { createUsernameHasher } from './createUsernameHasher.js';

export function createAccountDeletionDependencies(
  db: Database,
  boss: PgBoss,
  s3: S3Client,
  config: Pick<ApiConfig, 'SESSION_COOKIE_SECRET' | 'S3_BUCKET' | 'USERNAME_HASH_SECRET'>,
  hasher: PasswordHasher,
  logger: Pick<Logger, 'warn'>,
): AccountDeletionDeps {
  return {
    passwords: createLocalPasswordChanges(db),
    hasher,
    rateLimit: {
      store: createRateLimitStore(db),
      keyHasher: createRateLimitKeyHasher(config.SESSION_COOKIE_SECRET),
      now: Date.now,
    },
    store: createAccountDeletions(db, boss),
    hashUsername: createUsernameHasher(config.USERNAME_HASH_SECRET),
    storage: createProfileObjectStorage(s3, config.S3_BUCKET),
    logger,
  };
}
