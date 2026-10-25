import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { PreviewRepository } from '../application/ports.js';
import { createPreviewStore } from './createPreviewStore.js';

export function createPreviewRepository(pool: pg.Pool): PreviewRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createPreviewStore(client, familyId))),
  };
}
