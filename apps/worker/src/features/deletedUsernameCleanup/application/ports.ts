export interface DeletedUsernameCleanupRepository {
  removeExpired(): Promise<number>;
}

export interface DeletedUsernameCleanupDependencies {
  repository: DeletedUsernameCleanupRepository;
}
