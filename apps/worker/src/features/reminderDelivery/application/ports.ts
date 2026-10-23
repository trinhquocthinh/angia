import type { DeliveryUpdate, PushSubscriptionShape, SendOutcome } from '../domain/DeliveryTypes.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';

export interface UnsentReminder {
  reminderId: string;
  profileId: string;
  scheduledAt: Date;
  consentConfirmed: boolean;
}

export interface FanOutStore {
  /** sent_at IS NULL AND scheduled_at <= now, FOR UPDATE SKIP LOCKED. */
  listUnsentDue(now: Date): Promise<UnsentReminder[]>;
  listFamilyAccounts(): Promise<FamilyAccount[]>;
  listAssignments(): Promise<{ profileId: string; accountId: string }[]>;
  listDeviceIds(accountIds: string[]): Promise<string[]>;
  /** Insert đích pending (ON CONFLICT DO NOTHING) và đặt sent_at = now. */
  markFannedOut(reminderId: string, deviceIds: string[], now: Date): Promise<void>;
}

export interface DeliveryCandidate {
  deliveryId: string;
  reminderId: string;
  profileId: string;
  scheduledAt: Date;
  attempts: number;
  consentConfirmed: boolean;
  familyAccounts: FamilyAccount[];
  assignedAccountIds: string[];
  /** null khi đăng ký push đã bị gỡ (push_subscription_id SET NULL). */
  device: { id: string; accountId: string; subscription: PushSubscriptionShape } | null;
}

export interface DeliveryRepository {
  listFamilyIds(): Promise<string[]>;
  withFanOut<T>(familyId: string, work: (store: FanOutStore) => Promise<T>): Promise<T>;
  /** Transaction riêng: khóa một đích pending đến hạn, gọi decide, ghi DeliveryUpdate, COMMIT. null khi hết. */
  processNextDelivery(
    familyId: string,
    now: Date,
    decide: (candidate: DeliveryCandidate) => Promise<DeliveryUpdate>,
  ): Promise<DeliveryUpdate | null>;
}

export interface ReminderNotifier {
  send(subscription: PushSubscriptionShape, reminderId: string, ttlSeconds: number): Promise<SendOutcome>;
}

export type SendRemindersTotalKey =
  'fannedOut' | 'expiredBeforeFanout' | 'accepted' | 'retried' | 'failed' | 'gone' | 'expired' | 'revoked';

export type SendRemindersTotals = Record<SendRemindersTotalKey, number>;

export interface SendRemindersResult {
  totals: SendRemindersTotals;
  /** Chỉ mã lỗi (mã pg hoặc error.name), không bao giờ kèm thông điệp. */
  failures: { familyId: string; code: string }[];
  expiredBeforeFanoutReminderIds: string[];
  failedFamilies: number;
  aborted: boolean;
}
