import type { MyReminder } from '@angia/contracts';

export interface MyReminderRepository {
  /** SPEC-035: lời nhắc mà tài khoản phiên là người nhận hợp lệ; ngoài phạm vi → 404 chung. */
  get(reminderId: string, signal?: AbortSignal): Promise<MyReminder>;
}
