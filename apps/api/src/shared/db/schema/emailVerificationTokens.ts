import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, idColumn } from './columns.js';

// Không RLS: xác nhận token diễn ra trước khi biết nhà (SPEC-085). Chỉ lưu SHA-256 của token.
export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: idColumn(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('email_verification_tokens_account_id_idx').on(table.accountId),
    index('email_verification_tokens_expires_at_idx').on(table.expiresAt),
  ],
);
