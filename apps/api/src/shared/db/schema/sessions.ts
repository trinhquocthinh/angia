import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, idColumn } from './columns.js';

// Phiên đăng nhập phía máy chủ (Tech Spec §5.1); trình duyệt chỉ giữ cookie angia_session.
export const sessions = pgTable(
  'sessions',
  {
    id: idColumn(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    csrfToken: text('csrf_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('sessions_account_id_idx').on(table.accountId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);
