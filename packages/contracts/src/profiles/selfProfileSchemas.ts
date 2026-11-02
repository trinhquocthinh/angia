import { z } from 'zod';
import { myReminderSchema } from '../reminders/myReminderSchemas.js';

// SPEC-042: tóm tắt hồ sơ liên kết với tài khoản phiên; trả cả khi chưa đồng thuận để giao diện giải thích.
export const selfProfileSchema = z
  .object({
    id: z.uuid(),
    displayName: z.string(),
    birthYear: z.number().int().nullable(),
    consentStatus: z.enum(['pending', 'invited', 'declined', 'confirmed', 'withdrawn']),
    showsVitals: z.boolean(),
  })
  .meta({ id: 'SelfProfile' });
export type SelfProfile = z.infer<typeof selfProfileSchema>;

export const selfReminderQuerySchema = z.object({ date: z.iso.date().optional() });

// Xác nhận "Đã dùng" thêm ở E14-S4-T1 (SPEC-046).
const selfReminderSchema = myReminderSchema.omit({ profileName: true }).meta({ id: 'SelfReminder' });
export type SelfReminder = z.infer<typeof selfReminderSchema>;
export const selfReminderListSchema = z.array(selfReminderSchema);
