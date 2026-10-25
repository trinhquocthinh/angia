import { and, eq } from 'drizzle-orm';
import { listAdherencePeriodsBetween } from '@src/features/adherence/infrastructure/listAdherencePeriodsBetween.js';
import { listLabResults } from '@src/features/labResults/infrastructure/listLabResults.js';
import { listMeasurementsBetween } from '@src/features/measurements/infrastructure/listMeasurementsBetween.js';
import { findMedicationHistory } from '@src/features/medications/infrastructure/findMedicationHistory.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { VisitSummaryRepository } from '../application/ports.js';

// Tái dùng truy vấn của các phân hệ nguồn trong một transaction withFamilyScope (RLS);
// điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createVisitSummaryRepository(db: Database): VisitSummaryRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findProfile: async (profileId) => {
            const [profile] = await tx
              .select({
                id: healthProfiles.id,
                displayName: healthProfiles.displayName,
                birthYear: healthProfiles.birthYear,
                consentStatus: healthProfiles.consentStatus,
              })
              .from(healthProfiles)
              .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, familyId)));
            return profile ?? null;
          },
          findMedicationHistory: (profileId) => findMedicationHistory(tx, familyId, profileId),
          listMeasurementsBetween: (profileId, from, to) =>
            listMeasurementsBetween(tx, familyId, profileId, undefined, from, to),
          listLabResults: (profileId) => listLabResults(tx, familyId, profileId, undefined),
          listAdherencePeriodsBetween: (profileId, from, to) =>
            listAdherencePeriodsBetween(tx, familyId, profileId, from, to),
        }),
      ),
  };
}
