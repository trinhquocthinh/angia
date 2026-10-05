import { sql } from 'drizzle-orm';
import { pgPolicy, timestamp, uuid } from 'drizzle-orm/pg-core';
import { families } from './families.js';
import { newId } from './newId.js';

export const idColumn = () => uuid('id').primaryKey().$defaultFn(newId);

export const createdAtColumn = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const familyIdColumn = () =>
  uuid('family_id')
    .notNull()
    .references(() => families.id);

// Chính sách cô lập đa gia đình (Tech Spec §3, BR-003); drizzle-kit tự bật RLS cho bảng có policy.
export const familyIsolationPolicy = () =>
  pgPolicy('family_isolation_policy', {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`family_id = current_setting('app.family_id', true)::uuid`,
  });
