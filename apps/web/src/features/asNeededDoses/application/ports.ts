import type {
  AsNeededDose,
  AsNeededDoseList,
  CourseInterval,
  RecordAsNeededDoseRequest,
} from '@angia/contracts';

export type DoseQuery = { courseId: string; from: string; to: string };
export interface AsNeededDoseRepository {
  /** null dùng route tự xem, không nhận ID hồ sơ từ client. */
  list(profileId: string | null, query: DoseQuery, signal?: AbortSignal): Promise<AsNeededDoseList>;
  record(profileId: string, request: RecordAsNeededDoseRequest, csrf: string): Promise<AsNeededDose>;
  remove(profileId: string, doseId: string, csrf: string): Promise<void>;
  setInterval(
    profileId: string,
    courseId: string,
    text: string | null,
    csrf: string,
  ): Promise<CourseInterval>;
}
