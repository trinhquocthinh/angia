export interface PurgeRepository {
  profileExists(familyId: string, profileId: string): Promise<boolean>;
}
export interface PurgeStorage {
  list(prefix: string): AsyncIterable<{ key: string }>;
  delete(key: string): Promise<void>;
}
export interface PurgeDependencies {
  repository: PurgeRepository;
  storage: PurgeStorage;
}
export interface PurgeResult {
  outcome: 'purged' | 'skipped';
  removed: number;
}
