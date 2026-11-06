import { selfReadOnlyPolicies } from './selfReadOnlyPolicies.js';
import { sql } from 'drizzle-orm';
import { check, date, foreignKey, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { reminders } from './reminders.js';

// SPEC-046/BR-053: ảnh chụp đủ để hiển thị, không cascade từ đợt hay lời nhắc (BR-048); xóa hồ sơ thì xóa (BR-010).
// Unique cũng phục vụ tra cứu theo (hồ sơ, ngày).
export const doseConfirmations = pgTable(
  'dose_confirmations',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    date: date('date').notNull(),
    slot: text('slot', { enum: ['morning', 'noon', 'afternoon', 'evening'] }).notNull(),
    reminderId: uuid('reminder_id').references(() => reminders.id, { onDelete: 'set null' }),
    confirmedByAccountId: uuid('confirmed_by_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    confirmedByName: text('confirmed_by_name').notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    unique('dose_confirmations_profile_date_slot_unique').on(t.healthProfileId, t.date, t.slot),
    foreignKey({
      name: 'dose_confirmations_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    check('dose_confirmations_slot_valid', sql`${t.slot} IN ('morning', 'noon', 'afternoon', 'evening')`),
    check('dose_confirmations_name_length', sql`char_length(${t.confirmedByName}) BETWEEN 1 AND 60`),
    ...selfReadOnlyPolicies(),
    selfIsolationPolicy('health_profile_id'),
  ],
);
