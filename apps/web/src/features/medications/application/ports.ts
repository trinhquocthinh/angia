import type { CreateSelfReportedCourseRequest, MedicationCourse } from '@angia/contracts';
export interface MedicationRepository {
  create(
    profileId: string,
    request: CreateSelfReportedCourseRequest,
    csrf: string,
  ): Promise<MedicationCourse>;
}
