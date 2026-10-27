import { sql } from 'drizzle-orm';
import { check, index, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { aiBillingSources } from './aiBillingSources.js';

// Chỉ lưu định danh khoản phí, thời điểm và số tiền gốc; không có payload OCR hoặc gia đình.
export const aiProviderCharges = pgTable(
  'ai_provider_charges',
  {
    sourceId: uuid('source_id')
      .notNull()
      .references(() => aiBillingSources.id, { onDelete: 'restrict' }),
    externalId: text('external_id').notNull(),
    chargedAt: timestamp('charged_at', { withTimezone: true }).notNull(),
    counterAmount: numeric('counter_amount', { precision: 40, scale: 12 }).notNull(),
    unitDivisor: numeric('unit_divisor', { precision: 40, scale: 12 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourceId, table.externalId] }),
    index('ai_provider_charges_month_idx').on(table.chargedAt, table.sourceId),
    check('ai_provider_charges_counter_non_negative', sql`${table.counterAmount} >= 0`),
    check('ai_provider_charges_divisor_positive', sql`${table.unitDivisor} > 0`),
  ],
);
