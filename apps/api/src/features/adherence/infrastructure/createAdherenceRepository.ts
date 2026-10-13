import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { AdherenceRepository } from '../application/ports.js';
import { closeAdherencePeriod } from './closeAdherencePeriod.js';
import { findLatestAdherencePeriod } from './findLatestAdherencePeriod.js';
import { insertAdherencePeriod } from './insertAdherencePeriod.js';
import { listStoredAdherencePeriods } from './listStoredAdherencePeriods.js';
import { lockAdherenceProfile } from './lockAdherenceProfile.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createAdherenceRepository(db: Database): AdherenceRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findProfile: async (id) =>
            (
              await tx
                .select({ consentStatus: healthProfiles.consentStatus })
                .from(healthProfiles)
                .where(and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId)))
                .for('share')
            )[0] ?? null,
          lockAdherenceProfile: (id) => lockAdherenceProfile(tx, familyId, id),
          findLatestPeriod: (id, name) => findLatestAdherencePeriod(tx, familyId, id, name),
          closePeriod: (id, periodId, toDate) => closeAdherencePeriod(tx, familyId, id, periodId, toDate),
          insertPeriod: (input) => insertAdherencePeriod(tx, familyId, input),
          listPeriods: (id) => listStoredAdherencePeriods(tx, familyId, id),
        }),
      ),
  };
}
