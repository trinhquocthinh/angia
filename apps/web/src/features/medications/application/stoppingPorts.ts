import type { MedicationCourse, StopCourseRequest, StoppableCourses } from '@angia/contracts';
export interface MedicationStoppingRepository {
  list(profileId: string, signal?: AbortSignal): Promise<StoppableCourses>;
  stop(
    profileId: string,
    courseId: string,
    request: StopCourseRequest,
    csrf: string,
  ): Promise<MedicationCourse>;
}
