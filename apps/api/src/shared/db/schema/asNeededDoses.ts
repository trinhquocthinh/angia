import { selfReadOnlyPolicies } from './selfReadOnlyPolicies.js';
import { sql } from 'drizzle-orm';
import { check, foreignKey, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, idColumn, selfIsolationPolicy } from './columns.js';
import { healthProfiles } from './healthProfiles.js';
import { medicationCourses } from './medicationCourses.js';

// BR-054/SPEC-047: xóa chứng từ → xóa đợt → xóa nhật ký (BR-048); xóa hồ sơ thì xóa (BR-010).
export const asNeededDoses = pgTable(
  'as_needed_doses',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id').notNull(),
    medicationCourseId: uuid('medication_course_id')
      .notNull()
      .references(() => medicationCourses.id, { onDelete: 'cascade' }),
    givenAt: timestamp('given_at', { withTimezone: true }).notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 3 }),
    unit: text('unit'),
    recordedByAccountId: uuid('recorded_by_account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    foreignKey({
      name: 'as_needed_doses_profile_family_fk',
      columns: [t.healthProfileId, t.familyId],
      foreignColumns: [healthProfiles.id, healthProfiles.familyId],
    }).onDelete('cascade'),
    index('as_needed_doses_course_given_idx').on(t.medicationCourseId, t.givenAt.desc()),
    index('as_needed_doses_profile_given_idx').on(t.healthProfileId, t.givenAt),
    check(
      'as_needed_doses_quantity_valid',
      sql`${t.quantity} IS NULL OR (${t.quantity} > 0 AND ${t.quantity} <= 1000)`,
    ),
    check('as_needed_doses_unit_length', sql`${t.unit} IS NULL OR char_length(${t.unit}) BETWEEN 1 AND 20`),
    ...selfReadOnlyPolicies(),
    selfIsolationPolicy('health_profile_id'),
  ],
);
