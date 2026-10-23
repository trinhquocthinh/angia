import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, primaryKey, text, time, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-036/SPEC-025: tối đa một khung giờ cho mỗi buổi của hồ sơ; giờ theo Asia/Ho_Chi_Minh, chính xác tới phút.
export const doseSlots = pgTable(
  'dose_slots',
  {
    healthProfileId: uuid('health_profile_id').notNull(),
    familyId: familyIdColumn(),
    slot: text('slot', { enum: ['morning', 'noon', 'afternoon', 'evening'] }).notNull(),
    timeOfDay: time('time_of_day', { precision: 0 }).notNull(),
    createdAt: createdAtColumn(),
  },
  (t) => [
    primaryKey({ name: 'dose_slots_pk', columns: [t.healthProfileId, t.slot] }),
    foreignKey({
      name: 'dose_slots_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    check('dose_slots_slot_valid', sql`${t.slot} IN ('morning', 'noon', 'afternoon', 'evening')`),
    check('dose_slots_whole_minute', sql`extract(second from ${t.timeOfDay}) = 0`),
    familyIsolationPolicy(),
  ],
);
