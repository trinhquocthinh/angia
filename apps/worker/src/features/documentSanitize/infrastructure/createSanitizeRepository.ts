import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { SanitizeDependencies } from '../application/ports.js';
import { createSanitizeStore } from './createSanitizeStore.js';

export function createSanitizeRepository(pool: pg.Pool, boss: PgBoss): SanitizeDependencies['repository'] {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createSanitizeStore(client, familyId, boss))),
  };
}
