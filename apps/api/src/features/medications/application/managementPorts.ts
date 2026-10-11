import type { MedicationCourse } from '../domain/MedicationCourse.js';
import type { MedicationStore } from './ports.js';
interface MedicationManagementStore extends MedicationStore {
  findMedicationCourse(profileId: string, courseId: string): Promise<MedicationCourse | null>;
  stopMedicationCourse(
    profileId: string,
    courseId: string,
    endDate: string,
  ): Promise<MedicationCourse | null>;
}
export interface MedicationManagementRepository {
  withFamily<T>(familyId: string, work: (store: MedicationManagementStore) => Promise<T>): Promise<T>;
}
export type MedicationClock = () => Date;
export interface StopCourseRequest {
  familyId: string;
  profileId: string;
  courseId: string;
  stopDate: string;
}
export type StopCourseOutcome =
  | { ok: true; value: MedicationCourse }
  | {
      ok: false;
      code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_INVALID_STATE_TRANSITION' | 'ERR_VALIDATION';
    };
