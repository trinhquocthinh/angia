import { sql } from 'drizzle-orm';
import { bigint, check, jsonb, pgTable, smallint, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AiRoutingSettings } from '@angia/contracts';
import { accounts } from './accounts.js';

// Cấu hình quản trị toàn hệ thống, không có dữ liệu sức khỏe nên không áp RLS.
export const aiRoutingSettings = pgTable(
  'ai_routing_settings',
  {
    id: smallint('id').primaryKey(),
    version: bigint('version', { mode: 'number' }).notNull(),
    settings: jsonb('settings').$type<AiRoutingSettings>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    updatedBy: uuid('updated_by').references(() => accounts.id),
  },
  (table) => [
    check('ai_routing_settings_singleton', sql`${table.id} = 1`),
    check(
      'ai_routing_settings_version_valid',
      sql`${table.version} >= 0 AND ${table.version} <= 9007199254740991`,
    ),
    check('ai_routing_settings_payload_object', sql`jsonb_typeof(${table.settings}) = 'object'`),
    check(
      'ai_routing_settings_metadata_valid',
      sql`(${table.version} = 0 AND ${table.updatedAt} IS NULL AND ${table.updatedBy} IS NULL) OR (${table.version} > 0 AND ${table.updatedAt} IS NOT NULL AND ${table.updatedBy} IS NOT NULL)`,
    ),
  ],
);
