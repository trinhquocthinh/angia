import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';

// Tra credential trước khi biết nhà; không RLS family, không đưa hash vào DTO/log/export.
export const accountCredentials = pgTable(
  'account_credentials',
  {
    accountId: uuid('account_id')
      .primaryKey()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    credentialVersion: integer('credential_version').notNull().default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('account_credentials_version_positive', sql`${t.credentialVersion} > 0`),
    check(
      'account_credentials_hash_phc',
      sql`${t.passwordHash} ~ '^[$]argon2id[$]v=19[$]m=[1-9][0-9]*,t=[1-9][0-9]*,p=[1-9][0-9]*[$][A-Za-z0-9+/]+[$][A-Za-z0-9+/]+$'`,
    ),
  ],
);
