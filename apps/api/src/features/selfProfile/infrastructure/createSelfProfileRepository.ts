import { listDayReminderRows } from '@src/features/doseConfirmations/infrastructure/listDayReminderRows.js';
import { createLabResultRepository } from '@src/features/labResults/infrastructure/createLabResultRepository.js';
import { createMeasurementRepository } from '@src/features/measurements/infrastructure/createMeasurementRepository.js';
import { createMedicationRepository } from '@src/features/medications/infrastructure/createMedicationRepository.js';
import { createRevisitRepository } from '@src/features/prescriptions/infrastructure/createRevisitRepository.js';
import { createTimelineRepository } from '@src/features/timeline/infrastructure/createTimelineRepository.js';
import { createAsNeededDoseRepository } from '@src/features/asNeededDoses/infrastructure/createAsNeededDoseRepository.js';
import { createTemperatureRepository } from '@src/features/temperatures/infrastructure/createTemperatureRepository.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { FamilyScope } from '@src/shared/db/withFamilyScope.js';
import { withSelfScope } from '@src/shared/db/withSelfScope.js';
import type { SelfProfileRepository } from '../application/ports.js';
import { findSelfProfile } from './findSelfProfile.js';

export function createSelfProfileRepository(db: Database): SelfProfileRepository {
  return {
    forProfile: (profileId) => {
      const scope: FamilyScope = (scopedDb, familyId, work) =>
        withSelfScope(scopedDb, { familyId, profileId }, work);
      return {
        withFamily: (familyId, work) =>
          scope(db, familyId, (tx) =>
            work({
              profile: () => findSelfProfile(tx, familyId, profileId),
              reminders: (date) => listDayReminderRows(tx, familyId, profileId, date),
            }),
          ),
        measurements: createMeasurementRepository(db, scope),
        labResults: createLabResultRepository(db, scope),
        medications: createMedicationRepository(db, scope),
        revisits: createRevisitRepository(db, scope),
        timeline: createTimelineRepository(db, scope),
        asNeededDoses: createAsNeededDoseRepository(db, scope),
        temperatures: createTemperatureRepository(db, scope),
      };
    },
  };
}
