import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyDocument } from '../domain/PrivacyDocument.js';
import type { PrivacyEdits } from '../domain/privacyEdits.js';
import type { ObjectReader } from '../../documents/application/reviewPorts.js';
type PrivacyUpdate = Partial<
  Pick<
    PrivacyDocument,
    | 'status'
    | 'privacyDraftId'
    | 'privacyDraftStatus'
    | 'ocrImageKey'
    | 'ocrImageSha256'
    | 'privacyApprovedBy'
    | 'privacyApprovedAt'
  >
>;
export interface PrivacyStore {
  findDocument(id: string, lock?: boolean): Promise<PrivacyDocument | null>;
  consentConfirmed(profileId: string): Promise<boolean>;
  updateDocument(id: string, update: PrivacyUpdate): Promise<PrivacyDocument>;
  enqueuePreparation(documentId: string, draftId: string, edits: PrivacyEdits): Promise<void>;
  enqueueExtraction(documentId: string): Promise<void>;
}
export interface PrivacyRepository {
  withFamily<T>(familyId: string, work: (store: PrivacyStore) => Promise<T>): Promise<T>;
}
export interface PrivacyQueueReader {
  state(draftId: string): Promise<string | null>;
}
export interface PrivacyDependencies {
  repository: PrivacyRepository;
  reader: ObjectReader;
  queue: PrivacyQueueReader;
  hashPng(body: ReadableStream<Uint8Array>): Promise<string | null>;
  newId(): string;
  now(): Date;
}
export type { PrivacyDraft };
