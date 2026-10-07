import { type AssignmentRejection, decideAssignment } from '../domain/decideAssignment.js';
import type { FamilyRole } from '../domain/Membership.js';
import type { FamilyAdminRepository, MembershipOutcome } from './ports.js';

interface AssignMembershipInput {
  accountId: string;
  familyId: string;
  role: FamilyRole;
}

// SPEC-002: khóa tài khoản rồi nhóm trong cùng transaction để hai lệnh gán đồng thời không cùng lọt "nhóm trống".
export function assignMembership(
  repository: FamilyAdminRepository,
  input: AssignMembershipInput,
): Promise<MembershipOutcome<'ERR_NOT_FOUND' | AssignmentRejection>> {
  return repository.inTransaction(async (store) => {
    const account = await store.lockAccount(input.accountId);
    const members = account ? await store.lockFamilyMembers(input.familyId) : null;
    if (!account || !members) {
      return { ok: false, code: 'ERR_NOT_FOUND' };
    }
    const decision = decideAssignment({
      currentFamilyId: account.familyId,
      familyMemberCount: members.total,
      role: input.role,
    });
    if (!decision.ok) {
      return decision;
    }
    return { ok: true, account: await store.assign(input.accountId, input.familyId, input.role) };
  });
}
