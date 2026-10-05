import { z } from 'zod';

// Ngữ cảnh phiên cho web (Tech Spec §4 GET /api/me): family/role null = tài khoản chờ gán nhóm (/waiting).
export const meContextResponseSchema = z
  .object({
    account: z.object({
      id: z.uuid(),
      displayName: z.string(),
      isSystemAdmin: z.boolean(),
      healthProfileId: z.uuid().nullable(),
    }),
    family: z.object({ id: z.uuid(), name: z.string() }).nullable(),
    role: z.enum(['main', 'member']).nullable(),
    // Web gửi lại qua header X-CSRF-Token ở mọi POST/PUT/PATCH/DELETE (Tech Spec §5.1).
    csrfToken: z.string(),
  })
  .meta({ id: 'MeContextResponse' });

export type MeContextResponse = z.infer<typeof meContextResponseSchema>;
