import type { PrescriptionListItem } from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { MedicationCourse } from '@src/features/medications/domain/MedicationCourse.js';
import type { Prescription } from '../domain/Prescription.js';
import type { PrescriptionDiff } from '../domain/PrescriptionDiff.js';

export interface PrescriptionPosition {
  previousId: string | null;
  nextId: string | null;
}
export interface PrescriptionChainStore {
  profileConsent(profileId: string): Promise<ConsentStatus | null>;
  list(profileId: string): Promise<PrescriptionListItem[]>;
  findPosition(profileId: string, prescriptionId: string): Promise<PrescriptionPosition | null>;
  findPrescription(profileId: string, prescriptionId: string): Promise<Prescription | null>;
  courses(profileId: string, prescriptionId: string): Promise<MedicationCourse[]>;
}
export interface PrescriptionChainRepository {
  withFamily<T>(familyId: string, work: (store: PrescriptionChainStore) => Promise<T>): Promise<T>;
}
export interface PrescriptionDetail {
  prescription: Prescription;
  previousId: string | null;
  nextId: string | null;
  courses: MedicationCourse[];
  diff: PrescriptionDiff | null;
}
export type PrescriptionChainOutcome<T> =
  { ok: true; value: T } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
