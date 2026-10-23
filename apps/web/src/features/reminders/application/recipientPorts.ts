import type { ReminderRecipients } from '@angia/contracts';

export interface ReminderRecipientRepository {
  /** SPEC-026: người nhận hiện hành kèm tài khoản main có thể chỉ định. */
  get(profileId: string, signal?: AbortSignal): Promise<ReminderRecipients>;
  /** Thay toàn bộ người nhận của hồ sơ không liên kết tài khoản. */
  save(profileId: string, recipientAccountIds: string[], csrfToken: string): Promise<ReminderRecipients>;
}
