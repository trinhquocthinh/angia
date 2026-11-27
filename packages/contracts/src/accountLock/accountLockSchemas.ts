import { z } from 'zod';

export const adminAccountLockRequestSchema = z
  .strictObject({ reason: z.string().trim().min(1).max(200) })
  .meta({ id: 'AdminAccountLockRequest' });

export const adminAccountDetailSchema = z
  .strictObject({
    id: z.uuid(),
    username: z.string().nullable(),
    displayName: z.string(),
    familyName: z.string().nullable(),
    lockedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'AdminAccountDetail' });

export type AdminAccountLockRequest = z.infer<typeof adminAccountLockRequestSchema>;
export type AdminAccountDetail = z.infer<typeof adminAccountDetailSchema>;
