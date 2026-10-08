import type { NewSourceDocument, SourceDocument } from '../domain/SourceDocument.js';

interface UploadTarget {
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed';
}
export interface DocumentStore {
  findProfile(id: string): Promise<UploadTarget | null>;
  insertBatch(batch: { id: string; healthProfileId: string; createdBy: string }): Promise<void>;
  insertDocument(document: NewSourceDocument): Promise<SourceDocument>;
  /** Đẩy job OCR trong cùng transaction: chứng từ và job cùng commit hoặc cùng rollback (SPEC-008 → SPEC-009). */
  enqueueExtraction(documentId: string): Promise<void>;
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
}
