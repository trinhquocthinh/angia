import { sql } from 'drizzle-orm';
import { bigint, check, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AiRoutingSettings } from '@angia/contracts';
import { accounts } from './accounts.js';

// Mỗi version đã lưu có đúng một bản audit; không ghi ảnh, prompt hoặc secret.
export const aiRoutingAudit = pgTable(
  'ai_routing_audit',
  {
    version: bigint('version', { mode: 'number' }).primaryKey(),
    settings: jsonb('settings').$type<AiRoutingSettings>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    updatedBy: uuid('updated_by')
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [
    check(
      'ai_routing_audit_version_valid',
      sql`${table.version} > 0 AND ${table.version} <= 9007199254740991`,
    ),
    check('ai_routing_audit_payload_object', sql`jsonb_typeof(${table.settings}) = 'object'`),
  ],
);
