import type { SelfReminder } from '@angia/contracts';

export type DoseAction = 'confirm' | 'undo';

export interface DoseConfirmationRepository {
  /** SPEC-046: bấm lặp trả bản hiện có; giao diện đọc lại từ máy chủ nên không cần dữ liệu trả về. */
  confirm(reminderId: string, csrf: string): Promise<void>;
  undo(reminderId: string, csrf: string): Promise<void>;
  /** Lời nhắc hôm nay của hồ sơ cho `main`; route /api/me/reminders/{id} chỉ dành cho người nhận BR-039. */
  listForProfile(profileId: string, signal?: AbortSignal): Promise<SelfReminder[]>;
}
