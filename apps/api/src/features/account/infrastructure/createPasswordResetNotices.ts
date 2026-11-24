import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, adminAuditEvents } from '@src/shared/db/schema/index.js';
import type { PasswordResetNotices } from '../application/ports.js';

// Tra thông báo xác thực trước khi biết nhà, tương tự createCredentialRepository.
// Chỉ dùng bốn cột audit được cấp SELECT; không đọc id/metadata hay nội dung sức khoẻ.
export function createPasswordResetNotices(db: Database): PasswordResetNotices {
  return {
    async findLatestActor(accountId) {
      const latest = db
        .select({ actorId: adminAuditEvents.actorAccountId })
        .from(adminAuditEvents)
        .where(
          and(
            eq(adminAuditEvents.targetAccountId, accountId),
            eq(adminAuditEvents.action, 'password_reset_by_family'),
          ),
        )
        .orderBy(desc(adminAuditEvents.occurredAt))
        .limit(1)
        .as('latest_reset');
      const [row] = await db
        .select({ displayName: accounts.displayName })
        .from(latest)
        .leftJoin(accounts, eq(sql`${accounts.id}::text`, latest.actorId));
      return row?.displayName ?? null;
    },
  };
}
