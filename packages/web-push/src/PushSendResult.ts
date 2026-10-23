export interface PushSubscriptionValue {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export type PushSendResult =
  | { kind: 'accepted' }
  | { kind: 'gone' }
  | { kind: 'retry'; code: 'http_429' | 'http_5xx' | 'timeout' | 'network'; retryAfterSeconds?: number }
  | { kind: 'rejected'; code: 'http_4xx' | 'not_allowed' | 'disabled' };
