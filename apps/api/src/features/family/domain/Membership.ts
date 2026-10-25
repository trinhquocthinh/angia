export type FamilyRole = 'main' | 'member';

export interface Family {
  id: string;
  name: string;
  createdAt: Date;
}

// Góc nhìn Quản trị hệ thống về tài khoản: chỉ cấu trúc nhóm, không có liên kết hồ sơ sức khỏe (BR-003).
// familyId/role null = tài khoản chờ gán nhóm.
export interface MemberAccount {
  id: string;
  displayName: string;
  isSystemAdmin: boolean;
  familyId: string | null;
  role: FamilyRole | null;
}

export type MembershipChange = { action: 'change_role'; role: FamilyRole } | { action: 'remove' };

export type MembershipDecision<Code extends string> = { ok: true } | { ok: false; code: Code };
