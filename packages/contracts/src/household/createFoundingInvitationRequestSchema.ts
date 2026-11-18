import { z } from 'zod';

export const createFoundingInvitationRequestSchema = z.strictObject({
  kind: z.literal('found_family'),
});
