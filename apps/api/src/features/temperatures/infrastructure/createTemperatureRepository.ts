import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { temperatureReadings } from '@src/shared/db/schema/index.js';
import { type FamilyScope, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { TemperatureRepository } from '../application/ports.js';
import type { TemperatureReading } from '../domain/TemperatureReading.js';

const columns = {
  id: temperatureReadings.id,
  celsius: temperatureReadings.celsius,
  measuredAt: temperatureReadings.measuredAt,
  recordedBy: temperatureReadings.recordedByAccountId,
  recordedAt: temperatureReadings.createdAt,
};
// Cột numeric trả chuỗi.
const toReading = (row: Omit<TemperatureReading, 'celsius'> & { celsius: string }): TemperatureReading => ({
  ...row,
  celsius: Number(row.celsius),
});

// RLS qua withFamilyScope; điều kiện family_id/hồ sơ bổ sung phòng thủ theo chiều sâu.
export function createTemperatureRepository(
  db: Database,
  scope: FamilyScope = withFamilyScope,
): TemperatureRepository {
  return {
    withFamily: (familyId, work) =>
      scope(db, familyId, (tx) => {
        const ofProfile = (profileId: string) =>
          and(eq(temperatureReadings.familyId, familyId), eq(temperatureReadings.healthProfileId, profileId));
        return work({
          findProfile: (id) => findProfileInFamily(tx, familyId, id, 'share'),
          insertReading: async (input) => {
            const [row] = await tx
              .insert(temperatureReadings)
              .values({
                familyId,
                healthProfileId: input.healthProfileId,
                celsius: input.celsius.toFixed(1),
                measuredAt: input.measuredAt,
                recordedByAccountId: input.recordedBy,
              })
              .returning(columns);
            if (!row) throw new Error('Không ghi được nhiệt độ');
            return toReading(row);
          },
          deleteReading: async (profileId, readingId) =>
            (
              await tx
                .delete(temperatureReadings)
                .where(and(eq(temperatureReadings.id, readingId), ofProfile(profileId)))
                .returning({ id: temperatureReadings.id })
            ).length > 0,
          listReadings: async (profileId, range) =>
            (
              await tx
                .select(columns)
                .from(temperatureReadings)
                .where(
                  and(
                    ofProfile(profileId),
                    gte(temperatureReadings.measuredAt, range.from),
                    lt(temperatureReadings.measuredAt, range.to),
                  ),
                )
                .orderBy(asc(temperatureReadings.measuredAt), asc(temperatureReadings.id))
            ).map(toReading),
        });
      }),
  };
}
