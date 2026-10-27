import { sql } from 'drizzle-orm';
import { check, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Metadata quản trị toàn hệ thống, không có dữ liệu sức khỏe hoặc RLS gia đình.
export const aiBillingSources = pgTable(
  'ai_billing_sources',
  {
    id: uuid('id').primaryKey(),
    provider: text('provider').notNull(),
    credentialFingerprint: text('credential_fingerprint').notNull(),
    status: text('status').notNull().default('unverified'),
    lastCounter: numeric('last_counter', { precision: 40, scale: 12 }),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastCompleteAt: timestamp('last_complete_at', { withTimezone: true }),
    leaseToken: uuid('lease_token'),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('ai_billing_sources_credential_unique').on(table.provider, table.credentialFingerprint),
    check('ai_billing_sources_provider_valid', sql`${table.provider} IN ('woku', 'openrouter')`),
    check(
      'ai_billing_sources_status_valid',
      sql`${table.status} IN ('unverified', 'complete', 'gap', 'error', 'counter_reset', 'credential_changed', 'receipt_conflict', 'missing_credential')`,
    ),
    check('ai_billing_sources_counter_non_negative', sql`${table.lastCounter} >= 0`),
  ],
);
