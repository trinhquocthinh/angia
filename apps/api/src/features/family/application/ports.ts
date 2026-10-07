import type { AssignmentRejection } from '../domain/decideAssignment.js';
import type { Family, FamilyRole, MemberAccount } from '../domain/Membership.js';

interface MemberCounts {
  total: number;
  mains: number;
}

// Thao tác trong một transaction; thứ tự khóa luôn là tài khoản → nhóm để không deadlock.
export interface MembershipStore {
  // SELECT ... FOR UPDATE dòng tài khoản; null khi không tồn tại.
  lockAccount(accountId: string): Promise<MemberAccount | null>;
  // Khóa dòng nhóm rồi đếm thành viên: tuần tự hóa mọi thay đổi thành viên của cùng nhóm (BR-007).
  lockFamilyMembers(familyId: string): Promise<MemberCounts | null>;
  assign(accountId: string, familyId: string, role: FamilyRole): Promise<MemberAccount>;
  changeRole(accountId: string, role: FamilyRole): Promise<MemberAccount>;
  // Đưa tài khoản về trạng thái chờ gán nhóm và gỡ liên kết hồ sơ sức khỏe của nhóm cũ (BR-003, BR-008).
  remove(accountId: string): Promise<MemberAccount>;
}

export interface FamilyAdminRepository {
  createFamily(name: string): Promise<Family>;
  listFamilies(): Promise<Family[]>;
  listAccounts(): Promise<MemberAccount[]>;
  inTransaction<T>(work: (store: MembershipStore) => Promise<T>): Promise<T>;
}

type MembershipErrorCode = 'ERR_NOT_FOUND' | 'ERR_LAST_MAIN' | AssignmentRejection;

export type MembershipOutcome<Code extends MembershipErrorCode> =
  { ok: true; account: MemberAccount } | { ok: false; code: Code };
