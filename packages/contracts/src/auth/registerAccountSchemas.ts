import { z } from 'zod';

// Chỉ kiểm hình dạng; domain chịu trách nhiệm quy tắc đăng ký và details.field.
export const registerAccountRequestSchema = z
  .object({
    username: z.string(),
    password: z.string(),
    displayName: z.string(),
    email: z.string().optional(),
    ageConfirmed: z.boolean(),
    legalAcceptance: z.object({ termsVersionId: z.uuid(), privacyVersionId: z.uuid() }),
    invitationToken: z.string().optional(),
  })
  .meta({ id: 'RegisterAccountRequest' });

export const registerAccountResponseSchema = z
  .object({
    account: z.object({
      id: z.uuid(),
      username: z.string(),
      displayName: z.string(),
      familyId: z.uuid().nullable(),
    }),
    session: z.object({ csrfToken: z.string(), expiresAt: z.iso.datetime() }),
  })
  .meta({ id: 'RegisterAccountResponse' });
