import type { FamilyAccount, RecipientAccount, ReminderRecipients } from './ReminderRecipient.js';

const toRecipient = (a: FamilyAccount): RecipientAccount => ({ accountId: a.id, displayName: a.displayName });

// BR-039 (owner chốt 2026-10-23): hồ sơ liên kết luôn nhận qua tài khoản liên kết, danh sách đã lưu bị bỏ qua.
// Hồ sơ không liên kết chỉ tính người đã chỉ định còn là `main` cùng gia đình (lọc khi đọc); chưa chỉ
// định thì không có người nhận mặc định.
export function resolveReminderRecipients(
  profileId: string,
  familyAccounts: FamilyAccount[],
  storedAccountIds: string[],
): ReminderRecipients {
  const mains = familyAccounts.filter((a) => a.role === 'main');
  const candidates = mains.map(toRecipient);
  const linked = familyAccounts.find((a) => a.healthProfileId === profileId);
  if (linked) return { mode: 'linked', recipients: [toRecipient(linked)], candidates };
  const stored = new Set(storedAccountIds);
  return { mode: 'assigned', recipients: mains.filter((a) => stored.has(a.id)).map(toRecipient), candidates };
}
