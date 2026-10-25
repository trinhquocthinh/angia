import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { CurrentMedicationCourse } from '@src/features/medications/application/managementPorts.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { VisitSummaryProfile } from '../domain/VisitSummary.js';

// Các bảng lâm sàng chỉ chứa bản ghi đã duyệt; bản trích xuất chờ duyệt nằm riêng ở `extractions` (BR-013).
interface VisitSummaryStore {
  findProfile(profileId: string): Promise<(VisitSummaryProfile & { consentStatus: string }) | null>;
  /** Mọi đợt của hồ sơ, mọi trạng thái; bên gọi lọc theo ngày bằng SPEC-018. */
  findMedicationHistory(profileId: string): Promise<CurrentMedicationCourse[]>;
  /** Số đo mọi loại có ngày đo trong [from, to], cũ nhất trước. */
  listMeasurementsBetween(profileId: string, from: string, to: string): Promise<Measurement[]>;
  /** Mọi kết quả xét nghiệm của hồ sơ; bên gọi chọn bản mới nhất từng chỉ số. */
  listLabResults(profileId: string): Promise<LabResult[]>;
  /** SPEC-023: giai đoạn dùng thuốc giao với [from, to], theo tên chuẩn hóa rồi mốc tăng dần. */
  listAdherencePeriodsBetween(profileId: string, from: string, to: string): Promise<AdherencePeriod[]>;
}
export interface VisitSummaryRepository {
  withFamily<T>(familyId: string, work: (store: VisitSummaryStore) => Promise<T>): Promise<T>;
}
export interface VisitSummaryRequest {
  familyId: string;
  profileId: string;
  from?: string | undefined;
  to?: string | undefined;
}
