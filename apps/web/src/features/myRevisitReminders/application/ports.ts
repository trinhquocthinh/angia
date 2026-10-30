import type { MyRevisitReminder } from '@angia/contracts';
export interface MyRevisitReminderRepository {
  get(reminderId: string, signal?: AbortSignal): Promise<MyRevisitReminder>;
}
