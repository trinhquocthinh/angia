import { z } from 'zod';
export const addProfileGuardianRequestSchema = z.object({ guardianAccountId: z.uuid() }).strict();
export const profileGuardiansResponseSchema = z.object({
  guardians: z.array(z.object({ accountId: z.uuid(), displayName: z.string(), isMe: z.boolean() })),
});
