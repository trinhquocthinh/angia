import { z } from 'zod';
import { dailyDoseSlotSchema } from '../prescriptions/prescriptionSchema.js';

// SPEC-046/BR-053: một xác nhận cho cả buổi; accountId null khi tài khoản đã xóa, tên là ảnh chụp lúc bấm.
export const doseConfirmationSchema = z
  .object({
    reminderId: z.uuid(),
    profileId: z.uuid(),
    date: z.iso.date(),
    slot: dailyDoseSlotSchema,
    confirmedBy: z.object({ accountId: z.uuid().nullable(), displayName: z.string() }),
    confirmedAt: z.iso.datetime(),
  })
  .meta({ id: 'DoseConfirmation' });
export type DoseConfirmation = z.infer<typeof doseConfirmationSchema>;

export const doseConfirmationRequestSchema = z.strictObject({});

// Quyền do API tính (Design §9.6): giao diện không tự suy từ vai trò.
export const reminderConfirmationStateShape = {
  confirmation: doseConfirmationSchema.nullable(),
  canConfirm: z.boolean(),
  canUndo: z.boolean(),
};
