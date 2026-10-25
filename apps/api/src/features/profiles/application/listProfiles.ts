import type { ProfileRepository } from './ports.js';

export function listProfiles(repository: ProfileRepository, familyId: string) {
  return repository.withFamily(familyId, (store) => store.listProfiles());
}
