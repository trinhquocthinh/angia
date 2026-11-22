import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { adminAuditEvents } from '@src/shared/db/schema/index.js';

// Chỉ mở rộng khi thao tác nghiệp vụ tương ứng được triển khai và có test.
const ACTIONS = [
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
] as const;

interface AdminAuditEventInput {
  actorAccountId: string;
  familyId?: string;
  targetAccountId?: string;
  targetProfileId?: string;
  action: (typeof ACTIONS)[number];
}

// Nhận transaction của thao tác; không mở transaction riêng, không bắt lỗi ghi.
export async function writeAdminAuditEvent(tx: FamilyScopedTx, event: AdminAuditEventInput): Promise<void> {
  if (!ACTIONS.includes(event.action)) throw new Error('Loại sự kiện quản lý không hợp lệ');
  // Liệt kê từng trường để không chuyển tiếp metadata hoặc bí mật từ DTO runtime.
  await tx.insert(adminAuditEvents).values({
    actorAccountId: event.actorAccountId,
    familyId: event.familyId,
    targetAccountId: event.targetAccountId,
    targetProfileId: event.targetProfileId,
    action: event.action,
    metadata: event.action === 'member_removed' ? { reason: 'removed_from_family' } : {},
  });
}
