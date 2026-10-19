import type { QuotaPolicy, ReadQuotaUsage } from '../../familyQuota/application/ports.js';
import type { NewSourceDocument, SourceDocument } from '../domain/SourceDocument.js';

export interface ProfileConsent {
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed';
}
export interface DocumentStore {
  /** SPEC-030: mức dùng của gia đình trong transaction này; `lock` khóa quota theo gia đình trước khi đếm. */
  readQuotaUsage: ReadQuotaUsage;
  findProfile(id: string): Promise<ProfileConsent | null>;
  insertBatch(batch: { id: string; healthProfileId: string; createdBy: string }): Promise<void>;
  insertDocument(document: NewSourceDocument): Promise<SourceDocument>;
  /** Đẩy job preview trong cùng transaction: chứng từ và job cùng commit hoặc cùng rollback (SPEC-008 → SPEC-009). */
  enqueuePreview(documentId: string): Promise<void>;
}
export interface DocumentRepository {
  withFamily<T>(familyId: string, work: (store: DocumentStore) => Promise<T>): Promise<T>;
}
export interface ObjectStorage {
  put(
    key: string,
    body: ReadableStream<Uint8Array>,
    contentType: string,
    contentLength: number,
  ): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface DocumentDependencies {
  repository: DocumentRepository;
  storage: ObjectStorage;
  newId(): string;
  quota: QuotaPolicy;
}
