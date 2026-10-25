// E9-S2-T2: kiểu ledger gửi lời nhắc theo thiết bị (spec §4). Domain thuần, không import package ngoài.
export type DeliveryStatus = 'pending' | 'accepted' | 'gone' | 'failed' | 'expired' | 'revoked';

// Cùng shape với PushSendResult của @angia/web-push; khai báo lại để domain không phụ thuộc package.
export type SendOutcome =
  | { kind: 'accepted' }
  | { kind: 'gone' }
  | {
      kind: 'retry';
      code: 'http_429' | 'http_5xx' | 'timeout' | 'network';
      retryAfterSeconds?: number;
    }
  | { kind: 'rejected'; code: 'http_4xx' | 'not_allowed' | 'disabled' };

export interface DeliveryUpdate {
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt?: Date;
  acceptedAt?: Date;
  lastError?: string;
  /** Kết quả gone: gỡ đăng ký push (có điều kiện id + endpoint_hash ở tầng hạ tầng). */
  removeDevice?: true;
}

export interface PushSubscriptionShape {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Cửa sổ gửi: tới scheduled_at + 60 phút. */
export const SEND_WINDOW_MS = 3_600_000;
/** Nấc chờ (phút) trước retry thứ n, chọn theo attempts − 1. */
export const RETRY_BACKOFF_MINUTES = [1, 2, 4, 8, 16] as const;
/** Lần gửi đầu + 5 lần retry. */
export const MAX_SEND_ATTEMPTS = 6;
