import type { LabResult } from '../domain/LabResult.js';

interface LabResultStore {
  profileExists(profileId: string): Promise<boolean>;
  /** SPEC-021: mọi kết quả đã lưu của hồ sơ; có `normalizedTestName` thì chỉ chỉ số trùng tên chuẩn hóa. */
  listLabResults(profileId: string, normalizedTestName: string | undefined): Promise<LabResult[]>;
}
export interface LabResultRepository {
  withFamily<T>(familyId: string, work: (store: LabResultStore) => Promise<T>): Promise<T>;
}
