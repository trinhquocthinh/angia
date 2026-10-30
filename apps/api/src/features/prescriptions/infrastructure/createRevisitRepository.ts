import { and, eq } from 'drizzle-orm';
import { lockMedicationProfile } from '@src/features/medications/infrastructure/lockMedicationProfile.js';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { prescriptions } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { RevisitRepository } from '../application/revisitPorts.js';
import { cleanRevisitReminders } from './cleanRevisitReminders.js';
import { ensureRevisitReminder } from './ensureRevisitReminder.js';
import { listProfileRevisits } from './listProfileRevisits.js';

export function createRevisitRepository(db: Database): RevisitRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findProfile: (id) => findProfileInFamily(tx, familyId, id, 'share'),
          lockProfile: (id) => lockMedicationProfile(tx, familyId, id),
          listRevisits: (id, from) => listProfileRevisits(tx, familyId, id, from),
          findPrescription: async (profileId, id) =>
            (
              await tx
                .select({
                  issuedDate: prescriptions.issuedDate,
                  revisitDate: prescriptions.revisitDate,
                })
                .from(prescriptions)
                .where(
                  and(
                    eq(prescriptions.familyId, familyId),
                    eq(prescriptions.healthProfileId, profileId),
                    eq(prescriptions.id, id),
                  ),
                )
                .for('update')
            )[0] ?? null,
          updateDate: async (id, revisitDate) => {
            await tx
              .update(prescriptions)
              .set({ revisitDate })
              .where(and(eq(prescriptions.id, id), eq(prescriptions.familyId, familyId)));
          },
          cleanReminders: (id, date) => cleanRevisitReminders(tx, familyId, id, date),
          ensureReminder: (id, date, today) => ensureRevisitReminder(tx, familyId, id, date, today),
        }),
      ),
  };
}
