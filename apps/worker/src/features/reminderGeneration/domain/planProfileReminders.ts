import {
  DAILY_SLOTS,
  type CourseSnapshot,
  type DailyReminder,
  type DailySlot,
  type ProfileReminderPlan,
  type ProfileSnapshot,
  type ReminderMedication,
} from './DailyReminder.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { resolveRecipientAccountIds } from '@src/shared/domain/resolveRecipientAccountIds.js';

// BR-030/BR-038: hiệu lực tại ngày D chỉ theo khoảng ngày; dừng đợt đã gán endDate = ngày dừng − 1.
const isActiveOn = (course: CourseSnapshot, date: string) =>
  course.startDate <= date && (course.endDate === null || course.endDate >= date);

const toMedication = (course: CourseSnapshot): ReminderMedication => ({
  courseId: course.id,
  name: course.name,
  strength: course.strength,
  quantityPerDose: course.quantityPerDose,
  doseUnit: course.doseUnit,
});

// SPEC-027: gộp thuốc đang dùng ngày D theo buổi, mỗi buổi có thuốc và có khung giờ → đúng 01 lời nhắc.
// Buổi có thuốc nhưng chưa cấu hình giờ bị bỏ qua và trả về để cảnh báo (SPEC-025). Đợt "Khi cần" không
// thuộc buổi nào nên không sinh nhắc. Hồ sơ chưa đồng thuận hoặc không có người nhận hợp lệ thì bỏ qua.
export function planProfileReminders(
  profile: ProfileSnapshot,
  familyAccounts: readonly FamilyAccount[],
  date: string,
): ProfileReminderPlan {
  if (!profile.consentConfirmed) return { outcome: 'no_consent' };
  const active = profile.courses.filter((course) => isActiveOn(course, date));
  const groups: { slot: DailySlot; time: string; medications: ReminderMedication[] }[] = [];
  const unscheduledSlots: DailySlot[] = [];
  for (const slot of DAILY_SLOTS) {
    const courses = active.filter((course) => course.slots.includes(slot));
    if (courses.length === 0) continue;
    const time = profile.slotTimes[slot];
    if (!time) {
      unscheduledSlots.push(slot);
      continue;
    }
    const medications = courses.map(toMedication).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    groups.push({ slot, time, medications });
  }
  if (groups.length === 0) return { outcome: 'planned', reminders: [], unscheduledSlots };
  const recipientAccountIds = resolveRecipientAccountIds(
    profile.profileId,
    familyAccounts,
    profile.assignedAccountIds,
  );
  if (recipientAccountIds.length === 0) return { outcome: 'no_recipients' };
  const reminders = groups.map(({ slot, time, medications }): DailyReminder => ({
    profileId: profile.profileId,
    date,
    slot,
    scheduledAt: new Date(`${date}T${time}:00+07:00`),
    medications,
    recipientAccountIds,
  }));
  return { outcome: 'planned', reminders, unscheduledSlots };
}
