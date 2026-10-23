import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// SPEC-027/BR-037: tối đa một lời nhắc cho mỗi hồ sơ/ngày/buổi; job generate-reminders ghi ON CONFLICT DO NOTHING.
// medications là ảnh chụp thuốc của buổi tại lúc sinh ({ courseId, name, strength, quantityPerDose, doseUnit }).
// Người nhận không lưu ở đây: kiểm lại người nhận hợp lệ hiện hành khi gửi/đọc (owner chốt 2026-10-23).
// sent_at là dấu tổng hợp cũ, không thay kết quả gửi từng thiết bị (E9-S2-T2).
export const reminders = pgTable(
  'reminders',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    date: date('date').notNull(),
    slot: text('slot', { enum: ['morning', 'noon', 'afternoon', 'evening'] }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    medications: jsonb('medications').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    unique('reminders_profile_date_slot_unique').on(t.healthProfileId, t.date, t.slot),
    foreignKey({
      name: 'reminders_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('reminders_unsent_scheduled_idx')
      .on(t.scheduledAt)
      .where(sql`${t.sentAt} IS NULL`),
    check('reminders_slot_valid', sql`${t.slot} IN ('morning', 'noon', 'afternoon', 'evening')`),
    check(
      'reminders_medications_nonempty',
      sql`jsonb_typeof(${t.medications}) = 'array' AND jsonb_array_length(${t.medications}) >= 1`,
    ),
    familyIsolationPolicy(),
  ],
);
