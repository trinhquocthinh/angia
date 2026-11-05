import type { Database } from '@src/shared/db/createDatabase.js';
import { findProfileConsent } from '@src/features/profiles/infrastructure/findProfileConsent.js';
import { type FamilyScope, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { listAdherencePeriodsBetween } from '@src/features/adherence/infrastructure/listAdherencePeriodsBetween.js';
import type { MeasurementRepository } from '../application/ports.js';
import { listMeasurementPage } from './listMeasurementPage.js';
import { listMeasurementsBetween } from './listMeasurementsBetween.js';

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu.
export function createMeasurementRepository(
  db: Database,
  scope: FamilyScope = withFamilyScope,
): MeasurementRepository {
  return {
    withFamily: (familyId, work) =>
      scope(db, familyId, (tx) =>
        work({
          profileConsent: (profileId) => findProfileConsent(tx, familyId, profileId),
          listMeasurementPage: (profileId, kind, page) =>
            listMeasurementPage(tx, familyId, profileId, kind, page),
          listMeasurementsBetween: (profileId, kind, from, to) =>
            listMeasurementsBetween(tx, familyId, profileId, kind, from, to),
          listAdherencePeriodsBetween: (profileId, from, to) =>
            listAdherencePeriodsBetween(tx, familyId, profileId, from, to),
        }),
      ),
  };
}
