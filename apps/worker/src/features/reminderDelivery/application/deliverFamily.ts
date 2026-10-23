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

// SPEC-027 §5.2: kiểm lại điều kiện (BR-039) → cửa sổ gửi → gửi push → quy kết quả thành cập nhật ledger.
async function decide(
  candidate: DeliveryCandidate,
  notifier: ReminderNotifier,
  now: Date,
): Promise<DeliveryUpdate> {
  const { device, attempts, scheduledAt } = candidate;
  const eligibility = checkDeliveryEligibility({
    deviceAccountId: device?.accountId ?? null,
    profileId: candidate.profileId,
    consentConfirmed: candidate.consentConfirmed,
    familyAccounts: candidate.familyAccounts,
    assignedAccountIds: candidate.assignedAccountIds,
  });
  if (eligibility !== 'ok' || !device) return { status: 'revoked', attempts, lastError: eligibility };
  if (!isWithinSendWindow(scheduledAt, now)) return { status: 'expired', attempts };
  const ttlSeconds = remainingTtlSeconds(scheduledAt, now);
  const outcome = await notifier.send(device.subscription, candidate.reminderId, ttlSeconds);
  return planDeliveryOutcome(outcome, attempts, scheduledAt, now);
}

// Xử lý tối đa `budget` đích đến hạn của một gia đình, mỗi đích một transaction; cộng dồn vào totals.
// Trả số đích đã xử lý (để trừ ngân sách toàn lượt).
export async function deliverFamily(
  repository: DeliveryRepository,
  notifier: ReminderNotifier,
  familyId: string,
  now: Date,
  budget: number,
  totals: SendRemindersTotals,
): Promise<number> {
  let processed = 0;
  while (processed < budget) {
    const update = await repository.processNextDelivery(familyId, now, (candidate) =>
      decide(candidate, notifier, now),
    );
    if (update === null) break;
    processed += 1;
    totals[TOTAL_BY_STATUS[update.status]] += 1;
  }
  return processed;
}
