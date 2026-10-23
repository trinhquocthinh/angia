import { SEND_WINDOW_MS } from './DeliveryTypes.js';

const windowEnd = (scheduledAt: Date) => scheduledAt.getTime() + SEND_WINDOW_MS;

// Còn trong cửa sổ khi now ≤ scheduled_at + 60 phút (đúng mốc vẫn tính là trong cửa sổ).
export function isWithinSendWindow(scheduledAt: Date, now: Date): boolean {
  return now.getTime() <= windowEnd(scheduledAt);
}

// TTL gửi push service: số giây còn lại của cửa sổ, tối thiểu 60 giây.
export function remainingTtlSeconds(scheduledAt: Date, now: Date): number {
  return Math.max(60, Math.floor((windowEnd(scheduledAt) - now.getTime()) / 1000));
}
