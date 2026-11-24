import type { DeletedUsernameCleanupDependencies } from './ports.js';

export async function purgeDeletedUsernames(
  deps: DeletedUsernameCleanupDependencies,
): Promise<{ removed: number }> {
  return { removed: await deps.repository.removeExpired() };
}
