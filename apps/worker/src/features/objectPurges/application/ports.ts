export interface ObjectPurgeStore {
  next(limit: number, maxAttempts: number, afterKey?: string): Promise<string[]>;
  remove(key: string): Promise<void>;
  recordFailure(key: string, error: string): Promise<void>;
}

export interface ObjectPurgeRepository {
  listFamilies(): Promise<string[]>;
  withFamily<T>(familyId: string, work: (store: ObjectPurgeStore) => Promise<T>): Promise<T>;
}

export interface ObjectPurgeDependencies {
  repository: ObjectPurgeRepository;
  storage: { delete(key: string): Promise<void> };
}
