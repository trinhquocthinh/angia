import type { MemberAccount } from '../domain/Membership.js';
import type { FamilyAdminRepository } from './ports.js';

// Màn /admin (Design §6): mọi tài khoản kèm nhóm/vai trò, gồm cả tài khoản chờ gán nhóm.
export function listAccounts(repository: FamilyAdminRepository): Promise<MemberAccount[]> {
  return repository.listAccounts();
}
