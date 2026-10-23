import { z } from 'zod';
import { dailyDoseSlotSchema } from '../prescriptions/prescriptionSchema.js';

// SPEC-035: thuốc của buổi theo ảnh chụp lúc sinh lời nhắc; không lộ courseId ra ngoài.
const myReminderMedicationSchema = z
  .object({
    name: z.string(),
    strength: z.string().nullable(),
    quantityPerDose: z.string().nullable(),
    doseUnit: z.string().nullable(),
  })
  .meta({ id: 'MyReminderMedication' });

// SPEC-035: lời nhắc mà tài khoản phiên là người nhận hợp lệ hiện hành (BR-039).
export const myReminderSchema = z
  .object({
    id: z.uuid(),
    date: z.iso.date(),
    slot: dailyDoseSlotSchema,
    scheduledAt: z.iso.datetime(),
    profileName: z.string(),
    medications: z.array(myReminderMedicationSchema).min(1),
  })
  .meta({ id: 'MyReminder' });
export type MyReminder = z.infer<typeof myReminderSchema>;
