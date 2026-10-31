import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import type { TimelineRepository } from '../application/ports.js';
import { listTimelinePrescriptions } from './listTimelinePrescriptions.js';
import { listTimelineRevisits } from './listTimelineRevisits.js';
import { listTimelineMeasurements } from './listTimelineMeasurements.js';
import { listTimelineLabResults } from './listTimelineLabResults.js';
import { listTimelineStoppedCourses } from './listTimelineStoppedCourses.js';
import { listTimelineAdherencePeriods } from './listTimelineAdherencePeriods.js';
import { loadTimelinePrescriptionPairs } from './loadTimelinePrescriptionPairs.js';

export function createTimelineRepository(db: Database): TimelineRepository {
  // Cùng ảnh chụp dữ liệu cho sáu nguồn, đồng thuận và so sánh đơn.
  const reader: Pick<Database, 'transaction'> = {
    transaction: (work) =>
      db.transaction(work, { isolationLevel: 'repeatable read', accessMode: 'read only' }),
  };
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(reader, familyId, (tx) =>
        work({
          profile: async (id) =>
            (
              await tx
                .select({
                  consentStatus: healthProfiles.consentStatus,
                  birthYear: healthProfiles.birthYear,
                  vitalsEnabled: healthProfiles.vitalsEnabled,
                })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.familyId, familyId), eq(healthProfiles.id, id)))
            )[0] ?? null,
          sources: async (profileId, query, includeMeasurements) => {
            const scope = { tx, familyId, profileId };
            // Cùng một pg client: chạy tuần tự, không xếp nhiều query đang thực thi.
            return [
              await listTimelinePrescriptions(scope, query),
              await listTimelineRevisits(scope, query),
              await listTimelineLabResults(scope, query),
              await listTimelineStoppedCourses(scope, query),
              await listTimelineAdherencePeriods(scope, query),
              includeMeasurements ? await listTimelineMeasurements(scope, query) : [],
            ];
          },
          prescriptionPairs: (profileId, ids) =>
            loadTimelinePrescriptionPairs({ tx, familyId, profileId }, ids),
        }),
      ),
  };
}
