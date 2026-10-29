import type { QuotaPolicy, ReadQuotaUsage } from '../../familyQuota/application/ports.js';
import type { ConsentStatus } from '../../profiles/domain/HealthProfile.js';
import type { NewSourceDocument, SourceDocument } from '../domain/SourceDocument.js';
import type { DocumentDeletionDeps } from './deletionPorts.js';

export interface ProfileConsent {
  consentStatus: ConsentStatus;
}
export interface DocumentStore {
  /** SPEC-030: mức dùng của gia đình trong transaction này; `lock` khóa quota theo gia đình trước khi đếm. */
  readQuotaUsage: ReadQuotaUsage;
  findProfile(id: string): Promise<ProfileConsent | null>;
  insertBatch(batch: { id: string; healthProfileId: string; createdBy: string }): Promise<void>;
  insertDocument(document: NewSourceDocument): Promise<SourceDocument>;
  /** Đẩy job làm sạch ảnh trong cùng transaction: chứng từ và job cùng commit hoặc cùng rollback (SPEC-008 → SPEC-009). */
  enqueueSanitize(documentId: string): Promise<void>;
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
  // SPEC-037: xóa chứng từ dùng chung storage ở trên.
  deletion: Pick<DocumentDeletionDeps, 'repository' | 'purgeQueue'>;
}
