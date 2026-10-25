import { z } from 'zod';

const familyRoleSchema = z.enum(['main', 'member']);

// Tài khoản dưới góc nhìn Quản trị hệ thống (SPEC-002/003): không kèm liên kết hồ sơ sức khỏe (BR-003).
// familyId/role null = tài khoản chờ gán nhóm.
export const accountSchema = z
  .object({
    id: z.uuid(),
    displayName: z.string(),
    isSystemAdmin: z.boolean(),
    familyId: z.uuid().nullable(),
    role: familyRoleSchema.nullable(),
  })
  .meta({ id: 'Account' });

export type Account = z.infer<typeof accountSchema>;

export const assignMembershipRequestSchema = z
  .object({ familyId: z.uuid(), role: familyRoleSchema })
  .meta({ id: 'AssignMembershipRequest' });

export type AssignMembershipRequest = z.infer<typeof assignMembershipRequestSchema>;

export const changeMembershipRequestSchema = z
  .discriminatedUnion('action', [
    z.object({ action: z.literal('change_role'), role: familyRoleSchema }),
    z.object({ action: z.literal('remove') }),
  ])
  .meta({ id: 'ChangeMembershipRequest' });

export type ChangeMembershipRequest = z.infer<typeof changeMembershipRequestSchema>;
