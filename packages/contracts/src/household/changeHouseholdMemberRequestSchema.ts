import { z } from 'zod';

export const changeHouseholdMemberRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('change_role'), role: z.enum(['main', 'member']) }).strict(),
  z.object({ action: z.literal('remove') }).strict(),
]);
