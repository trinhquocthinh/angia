import type { NewSourceDocument, SourceDocument } from '../domain/SourceDocument.js';

interface UploadTarget {
  consentStatus: 'pending' | 'invited' | 'declined' | 'confirmed';
}
export interface DocumentStore {
  findProfile(id: string): Promise<UploadTarget | null>;
  insertBatch(batch: { id: string; healthProfileId: string; createdBy: string }): Promise<void>;
  insertDocument(document: NewSourceDocument): Promise<SourceDocument>;
}
export interface DocumentRepository {
  withFamily<T>(familyId: string, work: (store: DocumentStore) => Promise<T>): Promise<T>;
}
export interface ObjectStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface DocumentDependencies {
  repository: DocumentRepository;
  storage: ObjectStorage;
  newId(): string;
}
