import { z } from 'zod';

export const inspectHouseholdInvitationRequestSchema = z.strictObject({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
