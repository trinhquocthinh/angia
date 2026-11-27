import { z } from 'zod';

// Chỉ mở rộng khi thao tác nghiệp vụ tương ứng được triển khai và có test.
export const adminAuditActions = [
  'account_locked',
  'account_unlocked',
  'registration_switch_changed',
  'email_changed',
  'password_reset_by_email',
  'password_reset_by_family',
  'guardian_added',
  'guardian_removed',
  'family_created',
  'invitation_created',
  'invitation_revoked',
  'invitation_accepted',
  'member_role_changed',
  'member_removed',
  'member_left',
  'ownership_transfer_offered',
  'ownership_transfer_accepted',
  'ownership_transfer_declined',
  'ownership_transfer_revoked',
  'family_deletion_requested',
  'family_deletion_revoked',
  'family_deletion_executed',
  'account_deleted',
] as const;
export const adminAuditActionSchema = z.enum(adminAuditActions).meta({ id: 'AdminAuditAction' });
export const adminAuditEventSchema = z
  .strictObject({
    id: z.uuid(),
    occurredAt: z.iso.datetime({ offset: true }),
    actorAccountId: z.union([z.uuid(), z.literal('system_admin')]),
    familyId: z.uuid().nullable(),
    targetAccountId: z.uuid().nullable(),
    targetProfileId: z.uuid().nullable(),
    action: adminAuditActionSchema,
    metadata: z.record(z.string(), z.unknown()),
  })
  .meta({ id: 'AdminAuditEvent' });

export const adminAuditQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    familyId: z.uuid().optional(),
    accountId: z.uuid().optional(),
    action: adminAuditActionSchema.optional(),
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine(
    (q) => {
      if (!q.from || !q.to) return true;
      const delta = Date.parse(q.from) - Date.parse(q.to);
      if (delta !== 0) return delta < 0;
      // Date chỉ giữ millisecond; so tiếp phần lẻ để không nhận khoảng ngược microsecond.
      const fromFraction = q.from.match(/\.(\d+)/)?.[1] ?? '';
      const toFraction = q.to.match(/\.(\d+)/)?.[1] ?? '';
      const length = Math.max(fromFraction.length, toFraction.length);
      return fromFraction.padEnd(length, '0') <= toFraction.padEnd(length, '0');
    },
    { message: 'Thời điểm bắt đầu phải trước hoặc bằng kết thúc', path: ['from'] },
  )
  .meta({ id: 'AdminAuditQuery' });
export const adminAuditResponseSchema = z
  .strictObject({
    items: z.array(adminAuditEventSchema),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: 'AdminAuditResponse' });

export type AdminAuditEvent = z.infer<typeof adminAuditEventSchema>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
export type AdminAuditResponse = z.infer<typeof adminAuditResponseSchema>;
