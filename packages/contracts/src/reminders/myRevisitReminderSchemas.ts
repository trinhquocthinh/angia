import { z } from 'zod';

export const myRevisitReminderSchema = z
  .object({
    id: z.uuid(),
    revisitDate: z.iso.date(),
    offset: z.enum(['two_days_before', 'same_day']),
    profileId: z.uuid(),
    profileName: z.string(),
    prescriptions: z.array(
      z.object({ id: z.uuid(), issuedDate: z.iso.date(), facility: z.string().nullable() }),
    ),
    canOpenSummary: z.boolean(),
  })
  .meta({ id: 'MyRevisitReminder' });
export type MyRevisitReminder = z.infer<typeof myRevisitReminderSchema>;
