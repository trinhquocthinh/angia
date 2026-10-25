import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { FamilyAccount, ReminderRecipients } from '../domain/ReminderRecipient.js';

interface ReminderRecipientStore {
  /** Khóa dòng hồ sơ trong giao dịch hiện tại để tuần tự hóa các lệnh lưu. */
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  /** Tài khoản đang thuộc gia đình, theo thứ tự tạo. */
  listFamilyAccounts(): Promise<FamilyAccount[]>;
  listRecipientIds(profileId: string): Promise<string[]>;
  /** Thay toàn bộ người nhận của hồ sơ trong giao dịch hiện tại. */
  replaceRecipients(profileId: string, accountIds: string[]): Promise<void>;
}
export interface ReminderRecipientRepository {
  withFamily<T>(familyId: string, work: (store: ReminderRecipientStore) => Promise<T>): Promise<T>;
}

export interface SetReminderRecipientsRequest {
  familyId: string;
  profileId: string;
  recipientAccountIds: string[];
}
export type ReadRecipientsOutcome =
  { ok: true; value: ReminderRecipients } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type RecipientsOutcome =
  | { ok: true; value: ReminderRecipients }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' };
