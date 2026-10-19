import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { FamilyUsageRepository } from '../application/ports.js';
import { readFamilyUsage } from './readFamilyUsage.js';

export function createFamilyUsageRepository(db: Database): FamilyUsageRepository {
  return {
    read: (familyId, dayStart) =>
      withFamilyScope(db, familyId, (tx) => readFamilyUsage(tx, familyId, dayStart)),
  };
}
