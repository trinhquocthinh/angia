export interface RateLimitCleanupRepository {
  removeExpired(): Promise<number>;
}

export interface RateLimitCleanupDependencies {
  repository: RateLimitCleanupRepository;
}
