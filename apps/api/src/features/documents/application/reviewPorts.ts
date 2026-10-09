import type { LabResult, NewLabResult } from '@src/features/labResults/domain/LabResult.js';
import type {
  Measurement,
  MeasurementKind,
  NewMeasurement,
} from '@src/features/measurements/domain/Measurement.js';
import type { NewPrescription, Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import type { DocumentStatus, DocumentType, SourceDocument } from '../domain/SourceDocument.js';
import type { ProfileConsent } from './ports.js';

export interface DocumentFilter {
  statuses?: DocumentStatus[] | undefined;
  profileId?: string | undefined;
  /** Lọc theo lô: sắp theo ngày chứng từ tăng dần, chưa rõ ngày ở cuối (TC-022); trả cả lô. */
  batchId?: string | undefined;
  /** F09a: số bản tối đa của một trang và id chứng từ cuối trang trước. */
  limit: number;
  cursor?: string | undefined;
}
export interface DocumentPage {
  items: SourceDocument[];
  nextCursor: string | null;
}
export interface ReviewStore {
  listDocuments(filter: DocumentFilter): Promise<DocumentPage>;
  /** `lock` khóa dòng FOR UPDATE để hai lệnh duyệt đồng thời không cùng qua kiểm tra trạng thái. */
  findDocument(id: string, options?: { lock: boolean }): Promise<SourceDocument | null>;
  /** Payload thô của lần trích xuất mới nhất; presentation tự kiểm hợp đồng. */
  findLatestExtraction(documentId: string): Promise<unknown>;
  insertMeasurement(input: NewMeasurement): Promise<Measurement>;
  insertPrescription(input: NewPrescription): Promise<Prescription>;
  insertLabResults(inputs: NewLabResult[]): Promise<LabResult[]>;
  /** Bản ghi đã lưu của hồ sơ trong một ngày để kiểm trùng (SPEC-012), cả bản nhập trực tiếp. */
  findPrescriptionsOn(healthProfileId: string, issuedDate: string): Promise<Prescription[]>;
  findLabResultsOn(healthProfileId: string, resultDate: string): Promise<LabResult[]>;
  findMeasurementsOn(
    healthProfileId: string,
    kind: MeasurementKind,
    measuredOn: string,
  ): Promise<Measurement[]>;
  /** Hồ sơ cùng gia đình (khóa chia sẻ) để nhập trực tiếp không kèm chứng từ. */
  findProfile(id: string): Promise<ProfileConsent | null>;
  /** Ghi ngày chứng từ và loại (nhập tay có thể đổi loại); chỉ cập nhật khi trạng thái còn thuộc `from`. */
  markApproved(
    id: string,
    changes: { documentDate: string; type: DocumentType },
    from: readonly DocumentStatus[],
  ): Promise<SourceDocument>;
  /** Chỉ cập nhật khi trạng thái còn thuộc `from` (bảo vệ thêm ngoài khóa dòng). */
  markRejected(id: string, from: readonly DocumentStatus[]): Promise<SourceDocument>;
}
export interface ReviewRepository {
  withFamily<T>(familyId: string, work: (store: ReviewStore) => Promise<T>): Promise<T>;
}
export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  contentType: string;
}
export interface ObjectReader {
  get(key: string): Promise<StoredObject | null>;
}
