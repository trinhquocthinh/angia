import { deliverFamily } from './deliverFamily.js';
import { fanOutFamily } from './fanOutFamily.js';
import type {
  DeliveryRepository,
  ReminderNotifier,
  SendRemindersResult,
  SendRemindersTotals,
} from './ports.js';

const DEFAULT_MAX_DELIVERIES = 500;

export interface SendRemindersDeps {
  now(): Date;
  /** Ngân sách đích cho cả lượt (mọi gia đình); phần còn lại để lượt sau. */
  maxDeliveries?: number;
}

const emptyTotals = (): SendRemindersTotals => ({
  fannedOut: 0,
  expiredBeforeFanout: 0,
  accepted: 0,
  retried: 0,
  failed: 0,
  gone: 0,
  expired: 0,
  revoked: 0,
});

// SPEC-027 §5: mỗi lượt liệt kê gia đình, fan-out rồi gửi từng đích. Lỗi một gia đình không chặn
// gia đình khác; lỗi liệt kê gia đình → aborted. Không ném lỗi.
export async function sendReminders(
  repository: DeliveryRepository,
  notifier: ReminderNotifier,
  deps: SendRemindersDeps,
): Promise<SendRemindersResult> {
  const totals = emptyTotals();
  let familyIds: string[];
  try {
    familyIds = await repository.listFamilyIds();
  } catch {
    return { totals, failedFamilies: 0, aborted: true };
  }
  const now = deps.now();
  let remaining = deps.maxDeliveries ?? DEFAULT_MAX_DELIVERIES;
  let failedFamilies = 0;
  for (const familyId of familyIds) {
    try {
      const counts = await repository.withFanOut(familyId, (store) => fanOutFamily(store, now));
      totals.fannedOut += counts.fannedOut;
      totals.expiredBeforeFanout += counts.expiredBeforeFanout;
      if (remaining > 0)
        remaining -= await deliverFamily(repository, notifier, familyId, now, remaining, totals);
    } catch {
      failedFamilies += 1;
    }
  }
  return { totals, failedFamilies, aborted: false };
}
