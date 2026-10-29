export interface SanitizeDocument {
  id: string;
  healthProfileId: string;
  status: string;
  imageKey: string | null;
  privacyApprovedBy: string | null;
}
export interface SanitizedJpeg {
  bytes: Uint8Array;
  sha256: string;
}
export interface SanitizeStore {
  findDocument(id: string): Promise<SanitizeDocument | null>;
  saveSanitized(
    id: string,
    change: { oldKey: string; key: string; sha256: string; sizeBytes: number },
  ): Promise<'extracting' | 'manual_entry' | null>;
  markUnusable(id: string, oldKey: string): Promise<boolean>;
  recordPurge(key: string): Promise<void>;
}
export interface SanitizeDependencies {
  repository: { withFamily<T>(familyId: string, work: (store: SanitizeStore) => Promise<T>): Promise<T> };
  storage: {
    get(key: string): Promise<Uint8Array>;
    put(key: string, bytes: Uint8Array): Promise<void>;
    delete(key: string): Promise<void>;
  };
  images: { sanitize(bytes: Uint8Array): Promise<SanitizedJpeg> };
  newId(): string;
}
export interface SanitizeJob {
  documentId: string;
  familyId: string;
  finalAttempt: boolean;
}
export type SanitizeOutcome =
  { status: 'skipped' | 'extracting' } | { status: 'manual_entry'; reason?: 'image_unusable' };
