import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, idColumn } from './columns.js';

const DATA_EXPORT_STATUSES = ['pending', 'ready', 'failed'] as const;

// Không RLS gia đình: yêu cầu theo tài khoản (SPEC-072), job tự tra nhà hiện tại lúc chạy.
// profile_id NULL = phạm vi `self`; không FK để xoá hồ sơ không biến yêu cầu thành `self`.
export const dataExports = pgTable(
  'data_exports',
  {
    id: idColumn(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id'),
    status: text('status', { enum: DATA_EXPORT_STATUSES }).notNull().default('pending'),
    objectKey: text('object_key'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('data_exports_account_id_idx').on(table.accountId),
    index('data_exports_expires_at_idx').on(table.expiresAt),
    check('data_exports_status_valid', sql`${table.status} IN ('pending', 'ready', 'failed')`),
    check(
      'data_exports_ready_complete',
      sql`(${table.status} = 'ready') = (${table.objectKey} IS NOT NULL AND ${table.expiresAt} IS NOT NULL)`,
    ),
  ],
);
