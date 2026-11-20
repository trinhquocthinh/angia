import type { GuardianCandidate, ProfileGuardian } from './guardianPorts';

export const MAX_PROFILE_GUARDIANS = 2;

export function filterGuardianCandidates(
  members: GuardianCandidate[],
  guardians: ProfileGuardian[],
): GuardianCandidate[] {
  const existing = new Set(guardians.map((item) => item.accountId));
  return members.filter((member) => member.role === 'main' && !existing.has(member.accountId));
}

export function guardianErrorMessage(code: string): string {
  if (code === 'ERR_LAST_GUARDIAN') {
    return 'Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ.';
  }
  return 'Chưa lưu được. Thử lại sau.';
}

export function guardianRoleLabel(candidate: Pick<GuardianCandidate, 'isOwner'>): string {
  return candidate.isOwner ? 'Chủ hộ' : 'Đồng quản lý';
}

export function guardianInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const lastTwo = parts.slice(-2);
  return `${lastTwo[0]![0] ?? ''}${lastTwo[1]![0] ?? ''}`.toUpperCase();
}
