import type { DoseConfirmation } from '@angia/contracts';
import {
  doseConfirmationAccess,
  type DoseActor,
  type DoseAudience,
} from '../domain/doseConfirmationAccess.js';
import type { StoredDoseConfirmation } from './ports.js';

// SPEC-046: ngày khác hôm nay theo giờ Việt Nam chỉ đọc. canConfirm tắt khi đã có bản ghi vì không còn gì để bấm.
export function reminderConfirmationState(
  reminder: { id: string; date: string },
  actor: DoseActor,
  audience: DoseAudience,
  stored: StoredDoseConfirmation | null,
  today: string,
): { confirmation: DoseConfirmation | null; canConfirm: boolean; canUndo: boolean } {
  const { mayConfirm, mayUndo } = doseConfirmationAccess(actor, audience, stored);
  const isToday = reminder.date === today;
  return {
    confirmation: stored && { ...stored, reminderId: reminder.id },
    canConfirm: isToday && !stored && mayConfirm,
    canUndo: isToday && !!stored && mayUndo,
  };
}
