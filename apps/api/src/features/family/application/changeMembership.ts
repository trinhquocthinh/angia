import { decideMembershipChange } from '../domain/decideMembershipChange.js';
import type { MembershipChange } from '../domain/Membership.js';
import type { FamilyAdminRepository, MembershipOutcome } from './ports.js';

interface ChangeMembershipInput {
  accountId: string;
  change: MembershipChange;
}

// SPEC-003: khóa tài khoản rồi nhóm để hai lệnh hạ/gỡ main đồng thời không làm nhóm mất main cuối cùng.
// Tài khoản chưa thuộc nhóm nào không có membership để sửa → ERR_NOT_FOUND.
export function changeMembership(
  repository: FamilyAdminRepository,
  input: ChangeMembershipInput,
): Promise<MembershipOutcome<'ERR_NOT_FOUND' | 'ERR_LAST_MAIN'>> {
  return repository.inTransaction(async (store) => {
    const account = await store.lockAccount(input.accountId);
    if (!account?.familyId || !account.role) {
      return { ok: false, code: 'ERR_NOT_FOUND' };
    }
    const members = await store.lockFamilyMembers(account.familyId);
    const decision = decideMembershipChange({
      currentRole: account.role,
      mainCount: members?.mains ?? 0,
      change: input.change,
    });
    if (!decision.ok) {
      return decision;
    }
    const updated =
      input.change.action === 'remove'
        ? await store.remove(input.accountId)
        : await store.changeRole(input.accountId, input.change.role);
    return { ok: true, account: updated };
  });
}
