import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MeasurementRepository } from '../application/ports.js';
import { listMeasurementPage } from './listMeasurementPage.js';
import { listMeasurementsBetween } from './listMeasurementsBetween.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createMeasurementRepository(db: Database): MeasurementRepository {
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
          listMeasurementPage: (profileId, kind, page) =>
            listMeasurementPage(tx, familyId, profileId, kind, page),
          listMeasurementsBetween: (profileId, kind, from, to) =>
            listMeasurementsBetween(tx, familyId, profileId, kind, from, to),
        }),
      ),
  };
}
