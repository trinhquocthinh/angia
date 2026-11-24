import type { S3Client } from '@aws-sdk/client-s3';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { ApiConfig } from '@src/shared/config/loadApiConfig.js';
import { createS3ObjectReader } from '@src/features/documents/infrastructure/createS3ObjectReader.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import type { DataExportDependencies } from '../application/ports.js';
import { createDataExportRepository } from './createDataExportRepository.js';

export function createDataExportDependencies(
  db: Database,
  boss: PgBoss,
  s3: S3Client,
  config: Pick<ApiConfig, 'SESSION_COOKIE_SECRET' | 'S3_BUCKET'>,
): DataExportDependencies {
  return {
    repository: createDataExportRepository(db, boss, {
      store: createRateLimitStore(db),
      keyHasher: createRateLimitKeyHasher(config.SESSION_COOKIE_SECRET),
      now: Date.now,
    }),
    reader: createS3ObjectReader(s3, config.S3_BUCKET),
    now: () => new Date(),
  };
}
