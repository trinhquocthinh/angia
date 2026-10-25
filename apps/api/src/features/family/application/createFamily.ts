import type { Family } from '../domain/Membership.js';
import type { FamilyAdminRepository } from './ports.js';

// SPEC-001: nhóm mới chưa có tài khoản nào; quyền admin do requireAdmin chặn ở presentation (BR-006).
export function createFamily(repository: FamilyAdminRepository, input: { name: string }): Promise<Family> {
  return repository.createFamily(input.name);
}
