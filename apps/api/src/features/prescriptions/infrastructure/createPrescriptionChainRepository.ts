import type { Database } from '@src/shared/db/createDatabase.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { PrescriptionChainRepository } from '../application/prescriptionChainPorts.js';
import { findProfilePrescription } from './findProfilePrescription.js';
import { listProfilePrescriptions } from './listProfilePrescriptions.js';
import { findPrescriptionPosition } from './findPrescriptionPosition.js';
import { findPrescriptionCourses } from './findPrescriptionCourses.js';

export function createPrescriptionChainRepository(db: Database): PrescriptionChainRepository {
  // Một ảnh chụp cho vị trí, dòng và đợt: xóa đơn đồng thời không tạo response nửa cũ/nửa mới.
  const reader: Pick<Database, 'transaction'> = {
    transaction: (work) =>
      db.transaction(work, { isolationLevel: 'repeatable read', accessMode: 'read only' }),
  };
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(reader, familyId, (tx) =>
        work({
          profileConsent: async (id) => (await findProfileInFamily(tx, familyId, id))?.consentStatus ?? null,
          list: (id) => listProfilePrescriptions(tx, familyId, id),
          findPosition: (id, prescriptionId) => findPrescriptionPosition(tx, familyId, id, prescriptionId),
          findPrescription: (id, prescriptionId) => findProfilePrescription(tx, familyId, id, prescriptionId),
          courses: (id, prescriptionId) => findPrescriptionCourses(tx, familyId, id, prescriptionId),
        }),
      ),
  };
}
