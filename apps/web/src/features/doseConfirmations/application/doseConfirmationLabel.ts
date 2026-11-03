import type { DoseConfirmation } from '@angia/contracts';
import { describeReminderSchedule } from '@src/features/myReminders/application/describeReminderSchedule';

// Design §9.6: "Đã dùng · {người xác nhận} · {giờ}" theo giờ Việt Nam.
export function doseConfirmationLabel(confirmation: DoseConfirmation) {
  const { time } = describeReminderSchedule({ ...confirmation, scheduledAt: confirmation.confirmedAt });
  return `Đã dùng · ${confirmation.confirmedBy.displayName} · ${time}`;
}
