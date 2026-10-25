import type { FamilyRole, MembershipChange, MembershipDecision } from './Membership.js';

interface MembershipChangeFacts {
  currentRole: FamilyRole;
  mainCount: number;
  change: MembershipChange;
}

// SPEC-003: nhóm luôn còn ít nhất một main (BR-007) — chặn gỡ hoặc hạ vai trò main cuối cùng.
export function decideMembershipChange(facts: MembershipChangeFacts): MembershipDecision<'ERR_LAST_MAIN'> {
  const losesMain =
    facts.currentRole === 'main' && (facts.change.action === 'remove' || facts.change.role !== 'main');
  if (losesMain && facts.mainCount <= 1) {
    return { ok: false, code: 'ERR_LAST_MAIN' };
  }
  return { ok: true };
}
