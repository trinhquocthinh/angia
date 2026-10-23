import { z } from 'zod';
import { dailyDoseSlotSchema } from '../prescriptions/prescriptionSchema.js';

const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .meta({ id: 'TimeOfDay', description: 'Giờ:phút 24 giờ theo giờ Việt Nam, dạng HH:mm' });

// SPEC-025: body là cấu hình đầy đủ của hồ sơ — buổi không gửi nghĩa là bỏ khung giờ buổi đó
// (owner chốt 2026-10-23). Thứ tự tăng dần giữa các buổi do domain kiểm (BR-036).
export const setDoseSlotsRequestSchema = z
  .strictObject({
    slots: z.strictObject({
      morning: timeOfDaySchema.optional(),
      noon: timeOfDaySchema.optional(),
      afternoon: timeOfDaySchema.optional(),
      evening: timeOfDaySchema.optional(),
    }),
  })
  .meta({ id: 'SetDoseSlotsRequest' });
export type SetDoseSlotsRequest = z.infer<typeof setDoseSlotsRequestSchema>;

export const doseSlotTimeSchema = z
  .object({ slot: dailyDoseSlotSchema, time: timeOfDaySchema })
  .meta({ id: 'DoseSlot' });
export type DoseSlotTime = z.infer<typeof doseSlotTimeSchema>;

export const doseSlotListSchema = z.array(doseSlotTimeSchema).meta({ id: 'DoseSlotList' });
export type DoseSlotList = z.infer<typeof doseSlotListSchema>;
