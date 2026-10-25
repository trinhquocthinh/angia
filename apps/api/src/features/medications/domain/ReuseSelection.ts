import type { CourseResolution } from './MedicationConflict.js';

// Một dòng đơn được chọn khi "Dùng lại đơn này" (SPEC-029); tên, liều, buổi luôn lấy từ dòng gốc.
export interface ReuseSelection {
  readonly prescriptionItemId: string;
  readonly durationDays: number | null;
  readonly longTerm: boolean;
  readonly resolution?: CourseResolution | undefined;
  readonly expectedConflictCourseIds?: readonly string[] | undefined;
}
