import type { MedicationCourse } from './MedicationCourse.js';

export type CourseResolution = 'replace' | 'parallel';
export type ConflictCourse = MedicationCourse & { readonly strength?: string | null };
export interface ConflictItem {
  readonly name: string;
  readonly resolution?: CourseResolution | undefined;
  readonly expectedConflictCourseIds?: readonly string[] | undefined;
}
export interface MedicationConflict {
  readonly itemIndexes: number[];
  readonly nameNormalized: string;
  readonly courses: ConflictCourse[];
}
export type MedicationConflictPlan =
  | { readonly ok: false; readonly conflicts: MedicationConflict[] }
  | { readonly ok: true; readonly replaceCourseIds: string[]; readonly replacementEndDate: string };
