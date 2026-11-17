import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from './columns.js';

// ID đối tượng là snapshot: nhật ký phải còn khi nhà/tài khoản/hồ sơ bị xoá.
// App chỉ INSERT; đường đọc SystemAdmin được triển khai riêng ở E31.
export const adminAuditEvents = pgTable(
  'admin_audit_events',
  {
    id: idColumn(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actorAccountId: text('actor_account_id').notNull(),
    familyId: uuid('family_id'),
    targetAccountId: uuid('target_account_id'),
    targetProfileId: uuid('target_profile_id'),
    action: text('action').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (t) => [
    index('admin_audit_events_occurred_at_idx').on(t.occurredAt),
    index('admin_audit_events_family_id_idx').on(t.familyId),
    check('admin_audit_events_metadata_object', sql`jsonb_typeof(${t.metadata}) = 'object'`),
    check(
      'admin_audit_events_actor_valid',
      sql`${t.actorAccountId} = 'system_admin' OR ${t.actorAccountId} ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'`,
    ),
  ],
);
