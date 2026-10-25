import { z } from 'zod';
import { healthProfileSchema } from './healthProfileSchema.js';

export const consentConfirmationResponseSchema = z
  .object({
    outcome: z.enum(['confirmed', 'already_confirmed']),
    profile: healthProfileSchema,
    confirmedByDisplayName: z.string().nullable(),
  })
  .meta({ id: 'ConsentConfirmationResponse' });
export type ConsentConfirmationResponse = z.infer<typeof consentConfirmationResponseSchema>;
