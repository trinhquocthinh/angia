import { z } from 'zod';

// Nhóm gia đình (SPEC-001, Tech Spec §4 /api/admin/families).
export const familySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: 'Family' });

export type Family = z.infer<typeof familySchema>;

export const createFamilyRequestSchema = z
  .object({ name: z.string().trim().min(1).max(60) })
  .meta({ id: 'CreateFamilyRequest' });

export type CreateFamilyRequest = z.infer<typeof createFamilyRequestSchema>;
