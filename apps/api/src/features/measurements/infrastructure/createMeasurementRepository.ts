import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles, measurements } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MeasurementRepository } from '../application/ports.js';
import { toDbKind, toMeasurement } from './measurementRows.js';

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
          listMeasurements: async (profileId, kind) => {
            const conditions: SQL[] = [
              eq(measurements.healthProfileId, profileId),
              eq(measurements.familyId, familyId),
            ];
            if (kind) conditions.push(eq(measurements.kind, toDbKind(kind)));
            const rows = await tx
              .select()
              .from(measurements)
              .where(and(...conditions))
              .orderBy(
                desc(measurements.measuredOn),
                sql`${measurements.measuredTime} DESC NULLS LAST`,
                desc(measurements.createdAt),
              );
            return rows.map(toMeasurement);
          },
        }),
      ),
  };
}
