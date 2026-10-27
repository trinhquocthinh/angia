import { z } from 'zod';
import { healthProfileSchema } from './healthProfileSchema.js';

// Metadata chỉ dành cho danh sách của main; không trả ID tài khoản liên kết/lịch sử rút.
export const profileListItemSchema = healthProfileSchema
  .extend({
    consentAction: z.enum(['attestation', 'self', 'invitation']).nullable(),
    consentConfirmedByName: z.string().nullable(),
  })
  .meta({ id: 'ProfileListItem' });
export type ProfileListItem = z.infer<typeof profileListItemSchema>;
