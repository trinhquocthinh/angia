import { sql } from 'drizzle-orm';
import { check, foreignKey, index, numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

// BR-055/SPEC-048: CHECK 25,0–50,0 là lưới an toàn DB; khoảng 34,0–43,0 kèm xác nhận nằm ở application.
export const temperatureReadings = pgTable(
  'temperature_readings',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    celsius: numeric('celsius', { precision: 3, scale: 1 }).notNull(),
    measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
    recordedByAccountId: uuid('recorded_by_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      name: 'temperature_readings_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('temperature_readings_profile_measured_idx').on(t.healthProfileId, t.measuredAt),
    check('temperature_readings_celsius_range', sql`${t.celsius} BETWEEN 25.0 AND 50.0`),
    selfIsolationPolicy('health_profile_id'),
  ],
);
