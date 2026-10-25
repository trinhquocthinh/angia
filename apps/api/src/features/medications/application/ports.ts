import type { ConflictCourse, MedicationConflict, CourseResolution } from '../domain/MedicationConflict.js';
import type { MedicationCourse, NewMedicationCourse } from '../domain/MedicationCourse.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';

export interface MedicationStore {
  findProfile(id: string): Promise<{ consentStatus: string } | null>;
  lockMedicationProfile(profileId: string): Promise<void>;
  findMedicationCourses(profileId: string): Promise<ConflictCourse[]>;
  replaceMedicationCourses(profileId: string, ids: readonly string[], endDate: string): Promise<void>;
  insertMedicationCourses(inputs: readonly NewMedicationCourse[]): Promise<MedicationCourse[]>;
}
export interface MedicationRepository {
  withFamily<T>(familyId: string, work: (store: MedicationStore) => Promise<T>): Promise<T>;
}
export interface SelfReportedCourseRequest {
  familyId: string;
  profileId: string;
  name: string;
  strength?: string | null | undefined;
  quantityPerDose?: number | null | undefined;
  doseUnit: string;
  slots?: readonly DoseSlot[] | undefined;
  startDate: string;
  resolution?: CourseResolution | undefined;
  expectedConflictCourseIds?: readonly string[] | undefined;
}
export type SelfReportedCourseOutcome =
  | { ok: true; value: MedicationCourse }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_DOSE_INFO_MISSING' }
  | { ok: false; code: 'ERR_COURSE_CONFLICT_UNRESOLVED'; conflicts: MedicationConflict[] };
