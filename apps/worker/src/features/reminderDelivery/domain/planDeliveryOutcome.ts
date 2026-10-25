import {
  MAX_SEND_ATTEMPTS,
  RETRY_BACKOFF_MINUTES,
  type DeliveryUpdate,
  type SendOutcome,
} from './DeliveryTypes.js';
import { isWithinSendWindow } from './sendWindow.js';

const MINUTE_MS = 60_000;

// Mốc retry = now + max(backoff[attempts − 1], Retry-After).
function nextAttemptAt(attempts: number, now: Date, retryAfterSeconds?: number): Date {
  const backoffMs = (RETRY_BACKOFF_MINUTES[attempts - 1] ?? 0) * MINUTE_MS;
  const retryAfterMs = (retryAfterSeconds ?? 0) * 1000;
  return new Date(now.getTime() + Math.max(backoffMs, retryAfterMs));
}

// SPEC-027 §5.2: quy kết quả một lần gửi thành cập nhật ledger (backoff, Retry-After, kẹp cửa sổ, hết lượt).
export function planDeliveryOutcome(
  outcome: SendOutcome,
  attemptsBefore: number,
  scheduledAt: Date,
  now: Date,
): DeliveryUpdate {
  const attempts = attemptsBefore + 1;
  switch (outcome.kind) {
    case 'accepted':
      return { status: 'accepted', attempts, acceptedAt: now };
    case 'gone':
      // 404 và 410 dùng chung mã http_410.
      return { status: 'gone', attempts, lastError: 'http_410', removeDevice: true };
    case 'rejected':
      return { status: 'failed', attempts, lastError: outcome.code };
    case 'retry': {
      const lastError = outcome.code;
      if (attempts >= MAX_SEND_ATTEMPTS) return { status: 'failed', attempts, lastError };
      const next = nextAttemptAt(attempts, now, outcome.retryAfterSeconds);
      if (!isWithinSendWindow(scheduledAt, next)) return { status: 'expired', attempts, lastError };
      return { status: 'pending', attempts, nextAttemptAt: next, lastError };
    }
  }
}
