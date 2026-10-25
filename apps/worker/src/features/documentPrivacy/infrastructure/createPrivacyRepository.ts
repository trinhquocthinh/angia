import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { PrivacyRepository } from '../application/ports.js';
import { createPrivacyStore } from './createPrivacyStore.js';
export function createPrivacyRepository(pool: pg.Pool): PrivacyRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createPrivacyStore(client, familyId))),
  };
}
