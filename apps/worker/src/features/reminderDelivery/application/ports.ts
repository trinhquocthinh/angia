import type { DeliveryUpdate, PushSubscriptionShape, SendOutcome } from '../domain/DeliveryTypes.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';

export type ReminderKind = 'medication' | 'revisit';

export interface UnsentReminder {
  kind: ReminderKind;
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
  markFannedOut(reminderId: string, deviceIds: string[], now: Date, kind: ReminderKind): Promise<void>;
}

export interface DeliveryCandidate {
  kind: ReminderKind;
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
  /**
   * Transaction riêng: khóa một đích pending đến hạn, gọi decide, ghi DeliveryUpdate, COMMIT. null khi hết.
   * `clock` đọc lại lúc khóa và lúc ghi (updated_at) vì lần gửi HTTP giữa hai mốc có thể kéo dài.
   */
  processNextDelivery(
    familyId: string,
    clock: () => Date,
    decide: (candidate: DeliveryCandidate) => Promise<DeliveryUpdate>,
  ): Promise<DeliveryUpdate | null>;
}

export interface ReminderNotifier {
  send(
    subscription: PushSubscriptionShape,
    reminderId: string,
    ttlSeconds: number,
    kind: ReminderKind,
  ): Promise<SendOutcome>;
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
  /** listFamilyIds lỗi hoặc tín hiệu hủy (job hết hạn) bật giữa lượt. */
  aborted: boolean;
  /** Số đích failed theo last_error (chỉ mã như http_4xx, timeout). */
  failedByCode: Record<string, number>;
}
