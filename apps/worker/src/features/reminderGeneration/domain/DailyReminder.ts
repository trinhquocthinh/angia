// SPEC-027/BR-037: lời nhắc nghiệp vụ — tối đa một lời nhắc cho mỗi hồ sơ/ngày/buổi.
export const DAILY_SLOTS = ['morning', 'noon', 'afternoon', 'evening'] as const;
export type DailySlot = (typeof DAILY_SLOTS)[number];

export interface CourseSnapshot {
  id: string;
  name: string;
  strength: string | null;
  quantityPerDose: string | null;
  doseUnit: string | null;
  /** Gồm cả 'as_needed' (BR-025) — loại này không sinh nhắc theo giờ. */
  slots: string[];
  startDate: string;
  endDate: string | null;
}
export interface FamilyAccount {
  id: string;
  role: 'main' | 'member';
  healthProfileId: string | null;
}
export interface ProfileSnapshot {
  profileId: string;
  consentConfirmed: boolean;
  /** Khung giờ "HH:mm" giờ Việt Nam (BR-036). */
  slotTimes: { [slot in DailySlot]?: string };
  courses: CourseSnapshot[];
  /** Người nhận đã lưu ở reminder_recipients, chưa lọc theo vai trò hiện hành. */
  assignedAccountIds: string[];
}
export interface ReminderMedication {
  courseId: string;
  name: string;
  strength: string | null;
  quantityPerDose: string | null;
  doseUnit: string | null;
}
export interface DailyReminder {
  profileId: string;
  date: string;
  slot: DailySlot;
  scheduledAt: Date;
  medications: ReminderMedication[];
  recipientAccountIds: string[];
}
export type ProfileReminderPlan =
  | { outcome: 'planned'; reminders: DailyReminder[]; unscheduledSlots: DailySlot[] }
  | { outcome: 'no_consent' }
  | { outcome: 'no_recipients' };
