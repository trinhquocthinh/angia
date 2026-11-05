import type { Account, AdminProfileLink } from './ports';

// BR-008: chỉ tài khoản cùng nhóm chưa liên kết hồ sơ nào mới nhận được liên kết.
export function linkCandidates(accounts: Account[], familyId: string, profiles: AdminProfileLink[]) {
  const linked = new Set(profiles.map((profile) => profile.linkedAccount?.id));
  return accounts.filter((account) => account.familyId === familyId && !linked.has(account.id));
}
