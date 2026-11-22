import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { ObjectReader } from '@src/features/documents/application/reviewPorts.js';
import { createDataExportRepository } from '@src/features/dataExport/infrastructure/createDataExportRepository.js';
import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';

export function createProfileTestDataExportDependencies(
  database: Database,
  boss: PgBoss,
  reader: ObjectReader,
  now: () => Date = () => new Date(),
) {
  const rateLimit = {
    store: createRateLimitStore(database),
    keyHasher: createRateLimitKeyHasher('data-export-test-rate-limit-secret'),
    now: () => now().getTime(),
  };
  return { repository: createDataExportRepository(database, boss, rateLimit), reader, now };
}
