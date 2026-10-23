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

// Chỉ mã lỗi (mã pg như 42501 hoặc error.name) — thông điệp có thể chứa dữ liệu dòng.
function errorCode(error: unknown): string {
  const { code, name } = (error ?? {}) as { code?: unknown; name?: unknown };
  return String(code ?? name ?? 'unknown');
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
  const failures: SendRemindersResult['failures'] = [];
  const expiredIds: string[] = [];
  const result = (aborted: boolean): SendRemindersResult => ({
    totals,
    failures,
    expiredBeforeFanoutReminderIds: expiredIds,
    failedFamilies: failures.length,
    aborted,
  });
  let familyIds: string[];
  try {
    familyIds = await repository.listFamilyIds();
  } catch {
    return result(true);
  }
  const now = deps.now();
  const budget = { remaining: deps.maxDeliveries ?? DEFAULT_MAX_DELIVERIES };
  for (const familyId of familyIds) {
    try {
      const counts = await repository.withFanOut(familyId, (store) => fanOutFamily(store, now));
      totals.fannedOut += counts.fannedOut;
      totals.expiredBeforeFanout += counts.expiredReminderIds.length;
      expiredIds.push(...counts.expiredReminderIds);
      await deliverFamily(repository, notifier, familyId, now, budget, totals);
    } catch (error) {
      failures.push({ familyId, code: errorCode(error) });
    }
  }
  return result(false);
}
