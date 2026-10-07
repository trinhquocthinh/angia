import type { Measurement, NewMeasurement } from '@src/features/measurements/domain/Measurement.js';
import type { DocumentStatus, SourceDocument } from '../domain/SourceDocument.js';

export interface DocumentFilter {
  status?: DocumentStatus | undefined;
  profileId?: string | undefined;
}
export interface ReviewStore {
  listDocuments(filter: DocumentFilter): Promise<SourceDocument[]>;
  /** `lock` khóa dòng FOR UPDATE để hai lệnh duyệt đồng thời không cùng qua kiểm tra trạng thái. */
  findDocument(id: string, options?: { lock: boolean }): Promise<SourceDocument | null>;
  /** Payload thô của lần trích xuất mới nhất; presentation tự kiểm hợp đồng. */
  findLatestExtraction(documentId: string): Promise<unknown>;
  insertMeasurement(input: NewMeasurement): Promise<Measurement>;
  markApproved(id: string, documentDate: string): Promise<SourceDocument>;
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
