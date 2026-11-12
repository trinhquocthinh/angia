import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
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
    // Mặc định OIDC giữ tương thích repository cũ trong giai đoạn chuyển đổi.
    authMethod: text('auth_method', { enum: ['local', 'oidc'] })
      .notNull()
      .default('oidc'),
    oidcAuthTime: timestamp('oidc_auth_time', { withTimezone: true }),
    passwordChangeRequired: boolean('password_change_required').notNull().default(false),
    csrfToken: text('csrf_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    check('sessions_auth_method_valid', sql`${table.authMethod} IN ('local', 'oidc')`),
    unique('sessions_id_account_unique').on(table.id, table.accountId),
    index('sessions_account_id_idx').on(table.accountId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);
