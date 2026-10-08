import type { PrivacyEdits } from '../domain/PrivacyEdits.js';
export interface PrivacyDocument {
  id: string;
  healthProfileId: string;
  status: string;
  originalKey: string;
  mimeType: string;
  privacyDraftId: string | null;
  privacyDraftStatus: string | null;
  ocrImageKey: string | null;
}
export interface PrivacyStore {
  findDocument(id: string): Promise<PrivacyDocument | null>;
  saveReady(id: string, draftId: string, key: string, sha256: string): Promise<boolean>;
  markFailed(id: string, draftId: string): Promise<boolean>;
}
export interface PrivacyRepository {
  withFamily<T>(familyId: string, work: (store: PrivacyStore) => Promise<T>): Promise<T>;
}
export interface PrivacyStorage {
  get(key: string): Promise<Uint8Array>;
  put(key: string, bytes: Uint8Array): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface PrivacyImageRenderer {
  toPng(bytes: Uint8Array, mimeType: string, edits: PrivacyEdits): Promise<Uint8Array>;
}
export interface PrivacyDependencies {
  repository: PrivacyRepository;
  storage: PrivacyStorage;
  images: PrivacyImageRenderer;
  newId(): string;
}
export interface PrivacyJob {
  documentId: string;
  familyId: string;
  draftId: string;
  edits: PrivacyEdits;
  finalAttempt: boolean;
}
