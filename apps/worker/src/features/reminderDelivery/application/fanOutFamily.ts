import { isWithinSendWindow } from '../domain/sendWindow.js';
import type { FanOutStore, UnsentReminder } from './ports.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { resolveRecipientAccountIds } from '@src/shared/domain/resolveRecipientAccountIds.js';

export interface FanOutCounts {
  fannedOut: number;
  expiredBeforeFanout: number;
}

type Assignment = { profileId: string; accountId: string };

async function deviceIdsFor(
  store: FanOutStore,
  reminder: UnsentReminder,
  accounts: FamilyAccount[],
  assignments: Assignment[],
): Promise<string[]> {
  if (!reminder.consentConfirmed) return [];
  const assigned = assignments.filter((a) => a.profileId === reminder.profileId).map((a) => a.accountId);
  const recipients = resolveRecipientAccountIds(reminder.profileId, accounts, assigned);
  return recipients.length > 0 ? store.listDeviceIds(recipients) : [];
}

// SPEC-027 §5.1: tạo đích pending cho lời nhắc đến hạn chưa fan-out; luôn đặt sent_at kể cả khi 0 đích.
// Quá cửa sổ 60′ → không tạo đích (expired_before_fanout). Người nhận theo BR-039, hồ sơ phải đồng thuận.
export async function fanOutFamily(store: FanOutStore, now: Date): Promise<FanOutCounts> {
  const counts: FanOutCounts = { fannedOut: 0, expiredBeforeFanout: 0 };
  const due = await store.listUnsentDue(now);
  if (due.length === 0) return counts;
  const accounts = await store.listFamilyAccounts();
  const assignments = await store.listAssignments();
  for (const reminder of due) {
    if (!isWithinSendWindow(reminder.scheduledAt, now)) {
      await store.markFannedOut(reminder.reminderId, [], now);
      counts.expiredBeforeFanout += 1;
      continue;
    }
    const deviceIds = await deviceIdsFor(store, reminder, accounts, assignments);
    await store.markFannedOut(reminder.reminderId, deviceIds, now);
    counts.fannedOut += 1;
  }
  return counts;
}
