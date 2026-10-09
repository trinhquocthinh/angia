import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { prescriptions } from './prescriptions.js';

export const prescriptionItems = pgTable(
  'prescription_items',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => prescriptions.id, { onDelete: 'cascade' }),
    // Thứ tự dòng trên đơn để hiển thị và báo lỗi đúng dòng.
    position: integer('position').notNull(),
    name: text('name').notNull(),
    nameNormalized: text('name_normalized').notNull(),
    strength: text('strength'),
    quantityPerDose: numeric('quantity_per_dose').notNull(),
    doseUnit: text('dose_unit'),
    slots: text('slots').array().notNull(),
    durationDays: integer('duration_days'),
    longTerm: boolean('long_term').notNull(),
    note: text('note'),
    // Tổng số lượng in trên đơn, chỉ dùng để gợi ý số ngày có xác nhận (BR-025).
    totalQuantity: numeric('total_quantity'),
  },
  (t) => [
    index('prescription_items_prescription_idx').on(t.prescriptionId),
    // BR-025: đủ liều, buổi và số ngày hoặc dài hạn.
    check('prescription_items_duration', sql`${t.durationDays} IS NOT NULL OR ${t.longTerm} = true`),
    check('prescription_items_quantity_positive', sql`${t.quantityPerDose} > 0`),
    check(
      'prescription_items_slots_valid',
      sql`cardinality(${t.slots}) >= 1 AND ${t.slots} <@ ARRAY['morning', 'noon', 'afternoon', 'evening']::text[]`,
    ),
    check('prescription_items_duration_positive', sql`${t.durationDays} IS NULL OR ${t.durationDays} > 0`),
    check('prescription_items_total_positive', sql`${t.totalQuantity} IS NULL OR ${t.totalQuantity} > 0`),
    familyIsolationPolicy(),
  ],
);
