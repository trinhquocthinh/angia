import type { FamilyAccount } from './FamilyAccount.js';

// BR-039 (owner chốt 2026-10-23): hồ sơ liên kết → chính tài khoản đó, bỏ qua danh sách đã lưu.
// Hồ sơ không liên kết → người đã chỉ định còn là `main` của gia đình (lọc khi đọc); không có mặc định.
export function resolveRecipientAccountIds(
  profileId: string,
  familyAccounts: readonly FamilyAccount[],
  assignedAccountIds: readonly string[],
): string[] {
  const linked = familyAccounts.find((account) => account.healthProfileId === profileId);
  if (linked) return [linked.id];
  const currentMains = new Set(familyAccounts.filter((a) => a.role === 'main').map((a) => a.id));
  return assignedAccountIds.filter((id) => currentMains.has(id));
}
