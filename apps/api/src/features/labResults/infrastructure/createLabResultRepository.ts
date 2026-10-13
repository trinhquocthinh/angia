import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { LabResultRepository } from '../application/ports.js';
import { listLabResults } from './listLabResults.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createLabResultRepository(db: Database): LabResultRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          profileExists: async (profileId) =>
            (
              await tx
                .select({ id: healthProfiles.id })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)))
            ).length === 1,
          listLabResults: (profileId, normalizedTestName) =>
            listLabResults(tx, familyId, profileId, normalizedTestName),
        }),
      ),
  };
}
