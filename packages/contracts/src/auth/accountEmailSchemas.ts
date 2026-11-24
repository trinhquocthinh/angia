import { z } from 'zod';

export const changeAccountEmailRequestSchema = z
  .object({
    email: z.string(),
    currentPassword: z.string().min(1).max(1024),
  })
  .strict()
  .meta({ id: 'ChangeAccountEmailRequest' });
export const accountEmailResponseSchema = z
  .object({
    email: z.string().nullable(),
    emailVerified: z.boolean(),
    pendingEmail: z.string().nullable(),
  })
  .meta({ id: 'AccountEmailResponse' });
export const requestEmailVerificationResponseSchema = z
  .object({
    sent: z.literal(true),
  })
  .meta({ id: 'RequestEmailVerificationResponse' });
export const confirmEmailVerificationRequestSchema = z
  .object({
    token: z.string().max(1024),
  })
  .strict()
  .meta({ id: 'ConfirmEmailVerificationRequest' });
