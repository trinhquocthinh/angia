import { adminAuditActions } from '@angia/contracts';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { adminAuditEvents } from '@src/shared/db/schema/index.js';

interface AdminAuditEventInput {
  actorAccountId: string;
  familyId?: string;
  targetAccountId?: string;
  targetProfileId?: string;
  action: (typeof adminAuditActions)[number];
}

// Nhận transaction của thao tác; không mở transaction riêng, không bắt lỗi ghi.
export async function writeAdminAuditEvent(tx: FamilyScopedTx, event: AdminAuditEventInput): Promise<void> {
  if (!adminAuditActions.includes(event.action)) throw new Error('Loại sự kiện quản lý không hợp lệ');
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
