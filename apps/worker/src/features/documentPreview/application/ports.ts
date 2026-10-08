import type { PreviewImageConverter } from '../../extraction/application/ports.js';
export interface PreviewDocument {
  id: string;
  healthProfileId: string;
  status: string;
  originalKey: string;
  previewKey: string | null;
  mimeType: string;
}
export interface PreviewStore {
  findDocument(id: string): Promise<PreviewDocument | null>;
  savePreview(id: string, key: string): Promise<boolean>;
  markManualEntry(id: string): Promise<boolean>;
}
export interface PreviewRepository {
  withFamily<T>(familyId: string, work: (store: PreviewStore) => Promise<T>): Promise<T>;
}
export interface PreviewStorage {
  get(key: string): Promise<Uint8Array>;
  put(key: string, bytes: Uint8Array): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface PreviewDependencies {
  repository: PreviewRepository;
  storage: PreviewStorage;
  images: PreviewImageConverter;
  newId(): string;
}
