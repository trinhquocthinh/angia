import { checkDeliveryEligibility } from '../domain/checkDeliveryEligibility.js';
import type { DeliveryStatus, DeliveryUpdate } from '../domain/DeliveryTypes.js';
import { planDeliveryOutcome } from '../domain/planDeliveryOutcome.js';
import { isWithinSendWindow, remainingTtlSeconds } from '../domain/sendWindow.js';
import type {
  DeliveryCandidate,
  DeliveryRepository,
  ReminderNotifier,
  SendRemindersTotalKey,
  SendRemindersTotals,
} from './ports.js';

const TOTAL_BY_STATUS: Record<DeliveryStatus, SendRemindersTotalKey> = {
  pending: 'retried',
  accepted: 'accepted',
  failed: 'failed',
  gone: 'gone',
  expired: 'expired',
  revoked: 'revoked',
};

// SPEC-027 §5.2: cửa sổ gửi → kiểm lại điều kiện (BR-039) → gửi push → quy kết quả thành cập nhật ledger.
// Đọc đồng hồ ngay lúc xét đích (cửa sổ, TTL) và lại sau khi gửi (accepted_at, mốc retry): HTTP tuần tự
// có thể kéo dài, một mốc chung cả lượt sẽ gửi quá cửa sổ 60′ và khai TTL quá dài.
async function decide(
  candidate: DeliveryCandidate,
  notifier: ReminderNotifier,
  clock: () => Date,
): Promise<DeliveryUpdate> {
  const { device, attempts, scheduledAt } = candidate;
  const now = clock();
  if (!isWithinSendWindow(scheduledAt, now)) return { status: 'expired', attempts };
  const eligibility = checkDeliveryEligibility({
    deviceAccountId: device?.accountId ?? null,
    profileId: candidate.profileId,
    consentConfirmed: candidate.consentConfirmed,
    familyAccounts: candidate.familyAccounts,
    assignedAccountIds: candidate.assignedAccountIds,
  });
  if (eligibility !== 'ok' || !device) return { status: 'revoked', attempts, lastError: eligibility };
  const ttlSeconds = remainingTtlSeconds(scheduledAt, now);
  const outcome = await notifier.send(device.subscription, candidate.reminderId, ttlSeconds);
  return planDeliveryOutcome(outcome, attempts, scheduledAt, clock());
}

export interface DeliveryRun {
  repository: DeliveryRepository;
  notifier: ReminderNotifier;
  clock: () => Date;
  signal?: AbortSignal | undefined;
  /** Dùng chung cả lượt, trừ ngay sau mỗi đích nên giới hạn vẫn đúng khi gia đình lỗi giữa chừng. */
  budget: { remaining: number };
  totals: SendRemindersTotals;
  failedByCode: Record<string, number>;
}

function tally(run: DeliveryRun, update: DeliveryUpdate): void {
  run.totals[TOTAL_BY_STATUS[update.status]] += 1;
  if (update.status !== 'failed') return;
  const code = update.lastError ?? 'unknown';
  run.failedByCode[code] = (run.failedByCode[code] ?? 0) + 1;
}

// Xử lý đích đến hạn của một gia đình, mỗi đích một transaction; cộng dồn vào totals.
// Dừng khi hết ngân sách hoặc tín hiệu hủy bật (pg-boss hết hạn job) để lượt sau không chạy chồng.
export async function deliverFamily(run: DeliveryRun, familyId: string): Promise<void> {
  while (run.budget.remaining > 0 && !run.signal?.aborted) {
    const update = await run.repository.processNextDelivery(familyId, run.clock, (candidate) =>
      decide(candidate, run.notifier, run.clock),
    );
    if (update === null) break;
    run.budget.remaining -= 1;
    tally(run, update);
  }
}
