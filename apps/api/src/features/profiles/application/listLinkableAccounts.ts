import type { ProfileRepository } from './ports.js';

export function listLinkableAccounts(repository: ProfileRepository, familyId: string) {
  return repository.withFamily(familyId, (store) => store.listLinkableAccounts());
}
