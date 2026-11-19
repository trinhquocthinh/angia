import { z } from 'zod';

export const householdMembersSchema = z.object({
  members: z.array(
    z.object({
      accountId: z.uuid(),
      displayName: z.string(),
      role: z.enum(['main', 'member']),
      isOwner: z.boolean(),
      isSelf: z.boolean(),
    }),
  ),
});
