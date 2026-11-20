import { selfReadOnlyPolicies } from './selfReadOnlyPolicies.js';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { familyIsolationPolicy } from './columns.js';

export const objectPurges = pgTable(
  'object_purges',
  {
    objectKey: text('object_key').primaryKey(),
    // D4: hàng đợi vét còn sống sau khi xoá nhà (0046): không FK tới families.
    familyId: uuid('family_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => [
    index('object_purges_family_idx').on(table.familyId),
    ...selfReadOnlyPolicies(),
    familyIsolationPolicy(),
  ],
);
