import { z } from 'zod';

export const requestPasswordResetRequestSchema = z
  .object({
    email: z.string().trim().min(1).max(254),
  })
  .strict()
  .meta({ id: 'RequestPasswordResetRequest' });
export const requestPasswordResetResponseSchema = z
  .object({
    received: z.literal(true),
  })
  .meta({ id: 'RequestPasswordResetResponse' });
export const resetPasswordRequestSchema = z
  .object({
    token: z.string().max(1024),
    newPassword: z.string().min(1).max(1024),
  })
  .strict()
  .meta({ id: 'ResetPasswordRequest' });
