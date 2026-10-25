import { z } from 'zod';

// SPEC-026: body là danh sách đầy đủ người nhận của hồ sơ không liên kết tài khoản (≥ 1).
// Vai trò `main` cùng gia đình và việc hồ sơ không liên kết do domain kiểm (BR-039).
export const setReminderRecipientsRequestSchema = z
  .strictObject({ recipientAccountIds: z.array(z.uuid()).min(1).max(50) })
  .meta({ id: 'SetReminderRecipientsRequest' });
export type SetReminderRecipientsRequest = z.infer<typeof setReminderRecipientsRequestSchema>;

const recipientAccountSchema = z
  .object({ accountId: z.uuid(), displayName: z.string() })
  .meta({ id: 'ReminderRecipientAccount' });

export const reminderRecipientsSchema = z
  .object({
    mode: z.enum(['linked', 'assigned']).meta({
      description: 'linked: hồ sơ liên kết tài khoản, người nhận cố định; assigned: main được chỉ định',
    }),
    recipients: z.array(recipientAccountSchema),
    candidates: z.array(recipientAccountSchema).meta({ description: 'Tài khoản main có thể chỉ định' }),
  })
  .meta({ id: 'ReminderRecipients' });
export type ReminderRecipients = z.infer<typeof reminderRecipientsSchema>;
