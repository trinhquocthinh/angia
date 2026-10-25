import { index, pgTable, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { healthProfiles } from './healthProfiles.js';

export const uploadBatches = pgTable(
  'upload_batches',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    healthProfileId: uuid('health_profile_id')
      .notNull()
      .references(() => healthProfiles.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => accounts.id),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('upload_batches_health_profile_id_idx').on(table.healthProfileId),
    familyIsolationPolicy(),
  ],
);
