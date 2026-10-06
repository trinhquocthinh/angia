import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ExtractionRepository } from '../application/ports.js';
import { createExtractionStore } from './createExtractionStore.js';

// Pool phải kết nối bằng role app NOBYPASSRLS (DATABASE_URL).
export function createExtractionRepository(pool: pg.Pool): ExtractionRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createExtractionStore(client, familyId))),
  };
}
