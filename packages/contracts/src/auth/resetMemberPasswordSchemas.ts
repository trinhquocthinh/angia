import { z } from 'zod';

export const resetMemberPasswordParamsSchema = z
  .object({ targetAccountId: z.uuid() })
  .meta({ id: 'ResetMemberPasswordParams' });
export const resetMemberPasswordResponseSchema = z
  .object({
    temporaryPassword: z.string().min(16),
    expiresAt: z.iso.datetime(),
  })
  .meta({ id: 'ResetMemberPasswordResponse' });
