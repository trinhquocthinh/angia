import type { Family } from '../domain/Membership.js';
import type { FamilyAdminRepository } from './ports.js';

// Màn /admin (Design §6): danh sách nhóm gia đình, cũ nhất trước.
export function listFamilies(repository: FamilyAdminRepository): Promise<Family[]> {
  return repository.listFamilies();
}
