import { z } from 'zod';

export const acceptHouseholdInvitationRequestSchema = z.strictObject({
  token: z.string().trim().min(1).max(512),
});
