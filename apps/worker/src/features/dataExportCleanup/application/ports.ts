export interface CleanupDataExportsRepository {
  expired(): AsyncIterable<{ id: string; objectKey: string }>;
  removeExpired(id: string): Promise<boolean>;
  expireStale(): Promise<{ pendingFailed: number; failedRemoved: number }>;
  isActive(id: string): Promise<boolean>;
}
export interface CleanupDataExportsDependencies {
  repository: CleanupDataExportsRepository;
  storage: {
    list(): AsyncIterable<string>;
    delete(key: string): Promise<void>;
  };
}
export interface CleanupDataExportsResult {
  expiredRemoved: number;
  pendingFailed: number;
  failedRemoved: number;
  orphanRemoved: number;
  failed: number;
}
