import type { FamilyRole, MembershipDecision } from './Membership.js';

interface AssignmentFacts {
  currentFamilyId: string | null;
  familyMemberCount: number;
  role: FamilyRole;
}

export type AssignmentRejection = 'ERR_ACCOUNT_ALREADY_IN_FAMILY' | 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN';

// SPEC-002: tài khoản thuộc tối đa một nhóm (BR-001); người đầu tiên của nhóm phải là main (BR-007).
// Đổi vai trò trong cùng nhóm đi qua SPEC-003, không qua gán lại.
export function decideAssignment(facts: AssignmentFacts): MembershipDecision<AssignmentRejection> {
  if (facts.currentFamilyId !== null) {
    return { ok: false, code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' };
  }
  if (facts.familyMemberCount === 0 && facts.role !== 'main') {
    return { ok: false, code: 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN' };
  }
  return { ok: true };
}
