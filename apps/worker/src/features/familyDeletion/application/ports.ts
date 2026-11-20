export interface DueDeletionRequest {
  id: string;
  requestedBy: string;
}
// Lý do huỷ ghi vào cancel_reason và nhật ký; chỉ là mã, không chứa định danh.
export type DeletionCancelReason = 'family_not_empty' | 'owner_changed';
type DeletionAudit = 'family_deletion_executed' | 'family_deletion_revoked';

// Mọi phương thức chạy trong một transaction của một nhà (withFamilyScope).
export interface FamilyDeletionStore {
  // Khoá account → family → yêu cầu bằng role app (cùng thứ tự API), rồi chuyển sang role xoá nhà;
  // chỉ trả yêu cầu pending đã đến hạn. Mọi phương thức sau đó chạy bằng role xoá nhà.
  lockDue(): Promise<DueDeletionRequest | null>;
  readHousehold(): Promise<{ ownerId: string | null; accountIds: string[] }>;
  cancel(requestId: string, reason: DeletionCancelReason): Promise<void>;
  // Ghi khoá object vào object_purges, xoá dữ liệu nhà và gọi finalize; trả id hồ sơ đã xoá.
  deleteFamily(requestId: string): Promise<string[]>;
  enqueuePurge(profileId: string): Promise<void>;
  // Job vét object_purges theo nhà (nhà đã mất dòng families nên không liệt kê được).
  enqueueFamilySweep(): Promise<void>;
  audit(action: DeletionAudit, request: DueDeletionRequest, metadata?: Record<string, string>): Promise<void>;
}
export interface FamilyDeletionRepository {
  listDueFamilyIds(): Promise<string[]>;
  withFamily<T>(familyId: string, work: (store: FamilyDeletionStore) => Promise<T>): Promise<T>;
}
export interface FamilyDeletionDependencies {
  repository: FamilyDeletionRepository;
  storage: {
    list(prefix: string): AsyncIterable<{ key: string }>;
    delete(key: string): Promise<void>;
  };
  logger: { info(...args: unknown[]): void; warn(...args: unknown[]): void; error(...args: unknown[]): void };
}
export interface FamilyDeletionResult {
  executed: number;
  cancelled: number;
  failed: number;
}
