import type { FamilyAccount } from './ReminderRecipient.js';

export type RecipientPlan = { ok: true; value: string[] } | { ok: false; code: 'ERR_VALIDATION' };

// SPEC-026: chỉ hồ sơ không liên kết tài khoản mới được chỉ định; cần ≥ 1 người nhận và mọi người nhận
// phải là tài khoản `main` của cùng gia đình (TC-069/070). ID trùng lặp gộp làm một.
export function planReminderRecipients(
  profileId: string,
  familyAccounts: FamilyAccount[],
  requested: string[],
): RecipientPlan {
  const invalid = { ok: false, code: 'ERR_VALIDATION' } as const;
  if (familyAccounts.some((a) => a.healthProfileId === profileId)) return invalid;
  const ids = [...new Set(requested)];
  const mains = new Set(familyAccounts.filter((a) => a.role === 'main').map((a) => a.id));
  if (ids.length === 0 || !ids.every((id) => mains.has(id))) return invalid;
  return { ok: true, value: ids };
}
