import { z } from 'zod';

export const inspectHouseholdInvitationResponseSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('join_family'), role: z.enum(['main', 'member']) }),
  z.strictObject({ kind: z.literal('found_family') }),
]);
