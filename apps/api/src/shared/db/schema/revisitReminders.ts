import { sql } from 'drizzle-orm';
import { check, date, foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-051: một nhắc cho mọi đơn của cùng hồ sơ/ngày hẹn/mốc; không gắn FK tới một đơn cụ thể.
export const revisitReminders = pgTable(
  'revisit_reminders',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    revisitDate: date('revisit_date').notNull(),
    offsetKind: text('offset_kind', { enum: ['two_days_before', 'same_day'] }).notNull(),
    sendDate: date('send_date').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    unique('revisit_reminders_profile_date_offset_unique').on(t.healthProfileId, t.revisitDate, t.offsetKind),
    unique('revisit_reminders_id_family_unique').on(t.id, t.familyId),
    foreignKey({
      name: 'revisit_reminders_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('revisit_reminders_unsent_scheduled_idx')
      .on(t.scheduledAt)
      .where(sql`${t.sentAt} IS NULL`),
    check(
      'revisit_reminders_send_date_valid',
      sql`(${t.offsetKind} = 'two_days_before' AND ${t.sendDate} = ${t.revisitDate} - 2)
        OR (${t.offsetKind} = 'same_day' AND ${t.sendDate} = ${t.revisitDate})`,
    ),
    familyIsolationPolicy(),
  ],
);
