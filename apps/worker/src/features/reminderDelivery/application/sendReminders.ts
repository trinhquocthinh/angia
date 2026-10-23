import { deliverFamily, type DeliveryRun } from './deliverFamily.js';
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
  /** job.signal của pg-boss: bật khi job hết hạn (expireInSeconds) → dừng trước đích kế tiếp. */
  signal?: AbortSignal | undefined;
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
// gia đình khác; lỗi liệt kê gia đình hoặc tín hiệu hủy → aborted. Không ném lỗi.
export async function sendReminders(
  repository: DeliveryRepository,
  notifier: ReminderNotifier,
  deps: SendRemindersDeps,
): Promise<SendRemindersResult> {
  const run: DeliveryRun = {
    repository,
    notifier,
    clock: () => deps.now(),
    signal: deps.signal,
    budget: { remaining: deps.maxDeliveries ?? DEFAULT_MAX_DELIVERIES },
    totals: emptyTotals(),
    failedByCode: {},
  };
  const failures: SendRemindersResult['failures'] = [];
  const expiredIds: string[] = [];
  const result = (aborted: boolean): SendRemindersResult => ({
    totals: run.totals,
    failures,
    expiredBeforeFanoutReminderIds: expiredIds,
    failedFamilies: failures.length,
    aborted,
    failedByCode: run.failedByCode,
  });
  let familyIds: string[];
  try {
    familyIds = await repository.listFamilyIds();
  } catch {
    return result(true);
  }
  for (const familyId of familyIds) {
    if (deps.signal?.aborted) return result(true);
    try {
      const now = deps.now();
      const counts = await repository.withFanOut(familyId, (store) => fanOutFamily(store, now));
      run.totals.fannedOut += counts.fannedOut;
      run.totals.expiredBeforeFanout += counts.expiredReminderIds.length;
      expiredIds.push(...counts.expiredReminderIds);
      await deliverFamily(run, familyId);
    } catch (error) {
      failures.push({ familyId, code: errorCode(error) });
    }
  }
  return result(deps.signal?.aborted ?? false);
}
