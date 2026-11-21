import { z } from 'zod';

export const passwordLoginRequestSchema = z
  .object({
    identifier: z.string().min(1).max(254),
    password: z.string().min(1).max(1024),
  })
  .meta({ id: 'PasswordLoginRequest' });

export const passwordLoginResponseSchema = z
  .object({
    session: z.object({
      csrfToken: z.string(),
      expiresAt: z.iso.datetime(),
      passwordChangeRequired: z.boolean(),
      passwordResetBy: z.string().nullable(),
    }),
  })
  .meta({ id: 'PasswordLoginResponse' });
