import type { DocumentDeletionImpact } from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';

// SPEC-037: thao tác DB của xóa chứng từ, chạy trong một transaction withFamilyScope.
export interface DeletionStore {
  // lock = FOR UPDATE dòng chứng từ (DELETE); GET xem trước đọc không khóa.
  findDocument(
    id: string,
    lock: boolean,
  ): Promise<{ imageKey: string | null; profileConsentStatus: ConsentStatus } | null>;
  deleteDocument(id: string): Promise<void>;
  insertObjectPurge(key: string): Promise<void>;
  removeObjectPurge(key: string): Promise<void>;
  countImpact(id: string): Promise<DocumentDeletionImpact>;
}
export interface DeletionRepository {
  withFamily<T>(familyId: string, work: (store: DeletionStore) => Promise<T>): Promise<T>;
}
// Gửi job purge-pending-objects (SPEC-038) khi xóa object sau COMMIT thất bại.
export interface PurgeQueue {
  enqueue(): Promise<void>;
}
export interface DocumentDeletionDeps {
  repository: DeletionRepository;
  storage: { delete(key: string): Promise<void> };
  purgeQueue: PurgeQueue;
  logger: { warn(obj: object, msg: string): void };
}
