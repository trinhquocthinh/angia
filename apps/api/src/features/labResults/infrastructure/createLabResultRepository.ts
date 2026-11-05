import type { Database } from '@src/shared/db/createDatabase.js';
import { findProfileConsent } from '@src/features/profiles/infrastructure/findProfileConsent.js';
import { type FamilyScope, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { LabResultRepository } from '../application/ports.js';
import { listLabResults } from './listLabResults.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createLabResultRepository(
  db: Database,
  scope: FamilyScope = withFamilyScope,
): LabResultRepository {
  return {
    withFamily: (familyId, work) =>
      scope(db, familyId, (tx) =>
        work({
          profileConsent: (profileId) => findProfileConsent(tx, familyId, profileId),
          listLabResults: (profileId, normalizedTestName) =>
            listLabResults(tx, familyId, profileId, normalizedTestName),
        }),
      ),
  };
}
