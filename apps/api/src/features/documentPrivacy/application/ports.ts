import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyDocument } from '../domain/PrivacyDocument.js';
import type { PrivacyEdits } from '../domain/privacyEdits.js';
import type { AiBudgetPolicy, QuotaPolicy, ReadQuotaUsage } from '../../familyQuota/application/ports.js';
import type { AiBudgetSnapshot } from '../../familyQuota/domain/evaluateAiBudget.js';
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
/** Chứng từ kèm trạng thái đồng thuận của hồ sơ chủ (join) để gate đọc không thêm truy vấn. */
type PrivacyDocumentView = PrivacyDocument & { profileConsentStatus: ConsentStatus };
export interface PrivacyStore {
  /** SPEC-030: mức dùng của gia đình trong transaction này; `lock` khóa quota theo gia đình trước khi đếm. */
  readQuotaUsage: ReadQuotaUsage;
  /** SPEC-031: ngân sách AI tháng của gia đình (chỉ đọc). */
  readAiBudget(month: string, policy: AiBudgetPolicy): Promise<AiBudgetSnapshot>;
  findDocument(id: string, lock?: boolean): Promise<PrivacyDocumentView | null>;
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
  quota: QuotaPolicy;
  ai: AiBudgetPolicy;
}
export type { PrivacyDraft };
