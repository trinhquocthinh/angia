import { z } from 'zod';
import { accountEmailResponseSchema } from './accountEmailSchemas.js';

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
    authMethod: z.enum(['local', 'oidc']),
    hasLocalCredential: z.boolean(),
    emailStatus: accountEmailResponseSchema,
    // SPEC-083: true khi API có cấu hình OCR_MASK_URL → web hiện nút "Gợi ý vùng che".
    features: z.object({ redactionSuggestions: z.boolean(), localEnrollmentEnabled: z.boolean() }),
  })
  .meta({ id: 'MeContextResponse' });

export type MeContextResponse = z.infer<typeof meContextResponseSchema>;
